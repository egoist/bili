import './polyfills'
import path from 'path'
import colors from 'chalk'
import prettyBytes from 'pretty-bytes'
import formatTime from 'pretty-ms'
import textTable from 'text-table'
import resolveFrom from 'resolve-from'
import boxen from 'boxen'
import stringWidth from 'string-width'
import {
  rollup,
  watch,
  InputOptions,
  OutputOptions,
  Plugin as RollupPlugin,
  ModuleFormat as RollupFormat
} from 'rollup'
import merge from 'lodash/merge'
import waterfall from 'p-waterfall'
import spinner from './spinner'
import logger from './logger'
import progressPlugin from './plugins/progress'
import nodeResolvePlugin from './plugins/node-resolve'
import configLoader from './config-loader'
import isExternal from './utils/is-external'
import getBanner from './utils/get-banner'
import { BUILTIN_PLUGINS } from './constants'
import {
  Options,
  Config,
  NormalizedConfig,
  Format,
  ConfigEntryObject,
  Env,
  ConfigOutput,
  FileNameContext
} from './types'

// Make rollup-plugin-vue use basename in component.__file instead of absolute path
// TODO: PR to rollup-plugin-vue to allow this as an API option
process.env.BUILD = 'production'

interface RunOptions {
  write?: boolean
  watch?: boolean
  concurrent?: boolean
}

interface RunContext {
  unresolved: Set<string>
}

interface Task {
  title: string
  getConfig(context: RunContext, task: Task): Promise<RollupConfigOutput>
}

interface RollupInputConfig extends InputOptions {
  plugins: Array<RollupPlugin>
}

interface RollupOutputConfig extends OutputOptions {
  dir: string
}

interface RollupConfigOutput {
  inputConfig: RollupInputConfig
  outputConfig: RollupOutputConfig
}

interface RollupConfigInput {
  source: {
    input: string[] | ConfigEntryObject
    files: string[]
    hasVue: boolean
    hasTs: boolean
  }
  title: string
  format: Format
  context: RunContext
  assets: Assets
  config: NormalizedConfig
}

export class Bundler {
  rootDir: string
  config: NormalizedConfig
  configPath?: string
  pkg: {
    path?: string
    data?: any
  }
  bundles: Set<Assets>

  constructor(config: Config, public options: Options = {}) {
    logger.setOptions({ logLevel: options.logLevel })

    this.rootDir = path.resolve(options.rootDir || '.')

    this.pkg = configLoader.loadSync({
      files: ['package.json'],
      cwd: this.rootDir
    })
    if (!this.pkg.data) {
      this.pkg.data = {}
    }

    const userConfig =
      options.configFile === false
        ? {}
        : configLoader.loadSync({
            files:
              typeof options.configFile === 'string'
                ? [options.configFile]
                : [
                    'bili.config.js',
                    'bili.config.ts',
                    '.bilirc.js',
                    '.bilirc.ts',
                    'package.json'
                  ],
            cwd: this.rootDir,
            packageKey: 'bili'
          })
    if (userConfig.path) {
      logger.debug(`Using config file:`, userConfig.path)
      this.configPath = userConfig.path
    }

    this.config = this.normalizeConfig(
      config,
      userConfig.data || {}
    ) as NormalizedConfig

    this.bundles = new Set()
  }

  normalizeConfig(config: Config, userConfig: Config) {
    const result = merge({}, userConfig, config, {
      input: config.input || userConfig.input || 'src/index.js',
      output: merge({}, userConfig.output, config.output),
      plugins: merge({}, userConfig.plugins, config.plugins),
      babel: merge(
        {
          asyncToPromises: true
        },
        userConfig.babel,
        config.babel
      ),
      externals: [
        ...(Array.isArray(userConfig.externals)
          ? userConfig.externals
          : [userConfig.externals]),
        ...(Array.isArray(config.externals)
          ? config.externals
          : [config.externals])
      ]
    })

    result.output.dir = path.resolve(result.output.dir || 'dist')

    return result
  }

  async createRollupConfig({
    source,
    format,
    title,
    context,
    assets,
    config
  }: RollupConfigInput): Promise<RollupConfigOutput> {
    const plugins: RollupPlugin[] = []

    plugins.push(
      progressPlugin({
        title
      })
    )

    // Handle .json file
    plugins.push(require('rollup-plugin-json')())

    // Handle hashbang
    plugins.push(require('rollup-plugin-hashbang')())

    // Always minify if config.minify is truthy
    // Otherwise infer by format
    const minify =
      config.output.minify === undefined
        ? format.endsWith('-min')
        : config.output.minify
    let minPlaceholder = ''
    let rollupFormat: RollupFormat
    if (format.endsWith('-min')) {
      rollupFormat = format.replace(/-min$/, '') as RollupFormat
      minPlaceholder = '.min'
    } else {
      rollupFormat = format as RollupFormat
    }

    // UMD format should always bundle node_modules
    const bundleNodeModules =
      rollupFormat === 'umd' ||
      rollupFormat === 'iife' ||
      config.bundleNodeModules

    plugins.push(
      nodeResolvePlugin({
        rootDir: this.rootDir,
        bundleNodeModules,
        externals: config.externals,
        browser: config.output.target === 'browser'
      })
    )

    // Add user-supplied plugins
    // Excluded our builtin ones
    for (const name of Object.keys(config.plugins)) {
      if (!BUILTIN_PLUGINS.includes(name)) {
        const options = config.plugins[name]
        if (options) {
          let plugin = this.localRequire(`rollup-plugin-${name}`)
          plugin = plugin.default || plugin
          plugins.push(plugin(typeof options === 'object' ? options : {}))
        }
      }
    }

    plugins.push(
      require('rollup-plugin-postcss')(
        Object.assign({}, config.plugins.postcss, {
          extract: config.output.extractCSS !== false
        })
      )
    )

    if (source.hasTs && config.plugins.typescript2 !== false) {
      plugins.push(
        this.localRequire('rollup-plugin-typescript2')(
          merge(
            {
              objectHashIgnoreUnknownHack: true,
              tsconfigOverride: {
                compilerOptions: {
                  module: 'esnext'
                }
              }
            },
            config.plugins.typescript2
          )
        )
      )
    }

    if (config.plugins.babel !== false) {
      const pluginBabel = await import('./plugins/babel').then(
        res => res.default
      )
      plugins.push(
        pluginBabel(
          Object.assign(
            {
              exclude: 'node_modules/**',
              extensions: ['.js', '.jsx', '.mjs', '.ts', '.tsx'],
              babelrc: config.babel.babelrc,
              configFile: config.babel.configFile,
              presetOptions: config.babel
            },
            config.plugins.babel
          )
        )
      )
    }

    if (config.babel.minimal) {
      plugins.push(
        require('rollup-plugin-buble')({
          exclude: 'node_modules/**',
          include: '**/*.{js,mjs,jsx}',
          transforms: {
            modules: false,
            dangerousForOf: true,
            dangerousTaggedTemplateString: true
          }
        })
      )
    }

    if (config.plugins.vue !== false && (source.hasVue || config.plugins.vue)) {
      plugins.push(
        this.localRequire('rollup-plugin-vue')(
          Object.assign(
            {
              css: false
            },
            config.plugins.vue
          )
        )
      )
    }

    // Add commonjs plugin after babel and typescript
    // Since this plugin uses acorn to parse the source code
    const { commonjs } = config.plugins
    plugins.push(
      require('rollup-plugin-commonjs')({
        ...commonjs,
        // `ignore` is required to allow dynamic require
        // See: https://github.com/rollup/rollup-plugin-commonjs/blob/4a22147456b1092dd565074dc33a63121675102a/src/index.js#L32
        ignore: (name: string) => {
          if (commonjs && commonjs.ignore && commonjs.ignore(name)) {
            return true
          }
          return isExternal(config.externals, name)
        }
      })
    )

    if (config.env) {
      const env = Object.assign({}, config.env)
      plugins.push(
        require('rollup-plugin-replace')({
          ...Object.keys(env).reduce((res: Env, name) => {
            res[name] = JSON.stringify(env[name])
            return res
          }, {}),
          ...config.plugins.replace
        })
      )
    }

    const banner = getBanner(config.banner, this.pkg.data)

    if (minify) {
      const terserOptions = config.plugins.terser || {}
      plugins.push(
        require('rollup-plugin-terser').terser({
          ...terserOptions,
          output: {
            ...terserOptions.output,
            // Add banner (if there is)
            preamble: banner
          }
        })
      )
    }

    // Add bundle to out assets Map
    // So that we can log the stats when all builds completed
    // Make sure this is the last plugin!
    let startTime: number
    let endTime: number
    plugins.push({
      name: 'record-bundle',
      generateBundle(outputOptions, _assets) {
        const EXTS = [
          outputOptions.entryFileNames
            ? path.extname(outputOptions.entryFileNames)
            : '.js',
          '.css'
        ]
        for (const fileName of Object.keys(_assets)) {
          if (EXTS.some(ext => fileName.endsWith(ext))) {
            const file: any = _assets[fileName]
            const absolute =
              outputOptions.dir && path.resolve(outputOptions.dir, fileName)
            if (absolute) {
              const relative = path.relative(process.cwd(), absolute)
              assets.set(relative, {
                absolute,
                get source() {
                  return file.isAsset ? file.source.toString() : file.code
                }
              })
            }
          }
        }
      },
      buildStart() {
        startTime = Date.now()
      },
      buildEnd() {
        endTime = Date.now()
      },
      async writeBundle() {
        await printAssets(
          assets,
          `${title.replace('Bundle', 'Bundled')} ${colors.dim(
            `(${formatTime(endTime - startTime)})`
          )}`
        )
      }
    })

    const defaultFileName = getDefaultFileName(rollupFormat)
    const getFileName = config.output.fileName || defaultFileName
    const fileNameTemplate =
      typeof getFileName === 'function'
        ? getFileName({ format: rollupFormat, minify }, defaultFileName)
        : getFileName
    const fileName = fileNameTemplate
      .replace(/\[min\]/, minPlaceholder)
      .replace(/\[ext\]/, /^esm?$/.test(rollupFormat) ? '.mjs' : '.js')

    return {
      inputConfig: {
        input: source.input,
        plugins,
        external: Object.keys(config.globals || {})
          .filter(v => !/^[\.\/]/.test(v)),
        onwarn(warning) {
          if (typeof warning === 'string') {
            return logger.warn(warning)
          }
          const code = (warning.code || '').toLowerCase()
          if (code === 'mixed_exports' || code === 'missing_global_name') {
            return
          }
          let message = warning.message
          if (code === 'unresolved_import' && warning.source) {
            if (format !== 'umd' || context.unresolved.has(warning.source)) {
              return
            }
            context.unresolved.add(warning.source)
            message = `${warning.source} is treated as external dependency`
          }
          logger.warn(
            `${colors.yellow(`${code}`)}${colors.dim(':')} ${message}`
          )
        }
      },
      outputConfig: {
        globals: config.globals,
        format: rollupFormat,
        dir: path.resolve(config.output.dir || 'dist'),
        entryFileNames: fileName,
        name: config.output.moduleName,
        banner,
        sourcemap:
          typeof config.output.sourceMap === 'boolean'
            ? config.output.sourceMap
            : minify
      }
    }
  }

  async run(options: RunOptions = {}) {
    const context: RunContext = {
      unresolved: new Set()
    }
    const tasks: Task[] = []

    let { input } = this.config
    if (!Array.isArray(input)) {
      input = [input || 'src/index.js']
    }
    if (Array.isArray(input) && input.length === 0) {
      input = ['src/index.js']
    }

    const getMeta = (files: string[]) => {
      return {
        hasVue: files.some(file => file.endsWith('.vue')),
        hasTs: files.some(file => /\.tsx?$/.test(file))
      }
    }

    const normalizeInputValue = (input: string[] | ConfigEntryObject) => {
      if (Array.isArray(input)) {
        return input.map(
          v => `./${path.relative(this.rootDir, this.resolveRootDir(v))}`
        )
      }
      return Object.keys(input).reduce(
        (res: ConfigEntryObject, entryName: string) => {
          res[entryName] = `./${path.relative(
            this.rootDir,
            this.resolveRootDir(input[entryName])
          )}`
          return res
        },
        {}
      )
    }

    const sources = input.map(v => {
      if (typeof v === 'string') {
        const files = v.split(',')
        return {
          files,
          input: normalizeInputValue(files),
          ...getMeta(files)
        }
      }
      const files = Object.values(v)
      return {
        files,
        input: normalizeInputValue(v),
        ...getMeta(files)
      }
    })

    let { format } = this.config.output
    if (Array.isArray(format)) {
      if (format.length === 0) {
        format = ['cjs']
      }
    } else if (typeof format === 'string') {
      format = format.split(',') as Format[]
    } else {
      format = ['cjs']
    }
    const formats = format

    for (const source of sources) {
      for (const format of formats) {
        tasks.push({
          title: `Bundle ${source.files.join(', ')} in ${format} format`,
          getConfig: async (context, task) => {
            const assets: Assets = new Map()
            this.bundles.add(assets)
            const config = this.config.extendConfig
              ? this.config.extendConfig(merge({}, this.config), {
                  input: source.input,
                  format
                })
              : this.config
            return this.createRollupConfig({
              source,
              format,
              title: task.title,
              context,
              assets,
              config
            })
          }
        })
      }
    }

    if (options.watch) {
      const configs = await Promise.all(
        tasks.map(async task => {
          const { inputConfig, outputConfig } = await task.getConfig(
            context,
            task
          )
          return {
            ...inputConfig,
            output: outputConfig,
            watch: {}
          }
        })
      )
      const watcher = watch(configs)
      watcher.on('event', e => {
        if (e.code === 'ERROR') {
          logger.error(e.error.message)
        }
      })
    } else {
      try {
        if (options.concurrent) {
          await Promise.all(
            tasks.map(task => {
              return this.build(task, context, options.write)
            })
          )
        } else {
          await waterfall(
            tasks.map(task => () => {
              return this.build(task, context, options.write)
            }),
            context
          )
        }
      } catch (err) {
        spinner.stop()
        throw err
      }
    }

    return this
  }

  async build(task: Task, context: RunContext, write?: boolean) {
    try {
      const { inputConfig, outputConfig } = await task.getConfig(context, task)
      const bundle = await rollup(inputConfig)
      if (write) {
        await bundle.write(outputConfig)
      } else {
        await bundle.generate(outputConfig)
      }
    } catch (err) {
      err.rollup = true
      logger.error(task.title.replace('Bundle', 'Failed to bundle'))
      if (err.message.includes('You must supply output.name for UMD bundles')) {
        err.code = 'require_module_name'
        err.message = `You must supply output.moduleName option or use --module-name <name> flag for UMD bundles`
      }
      throw err
    }
  }

  handleError(err: any) {
    if (err.stack) {
      console.error()
      console.error(colors.bold(colors.red('Stack Trace:')))
      console.error(colors.dim(err.stack))
    }
  }

  resolveRootDir(...args: string[]) {
    return path.resolve(this.rootDir, ...args)
  }

  localRequire(
    name: string,
    { silent, cwd }: { silent?: boolean; cwd?: string } = {}
  ) {
    cwd = cwd || this.rootDir
    const resolved = silent
      ? resolveFrom.silent(cwd, name)
      : resolveFrom(cwd, name)
    return resolved && require(resolved)
  }

  getBundle(index: number) {
    return [...this.bundles][index]
  }
}

interface Asset {
  absolute: string
  source: string
}
type Assets = Map<string, Asset>

async function printAssets(assets: Assets, title: string) {
  const gzipSize = await import('gzip-size').then(res => res.default)
  const table = await Promise.all(
    [...assets.keys()].map(async relative => {
      const asset = assets.get(relative) as Asset
      const size = asset.source.length
      return [
        colors.green(relative),
        prettyBytes(size),
        prettyBytes(await gzipSize(asset.source))
      ]
    })
  )
  table.unshift(['File', 'Size', 'Gzipped'].map(v => colors.dim(v)))
  logger.success(title)
  logger.log(
    boxen(
      textTable(table, {
        stringLength: stringWidth
      })
    )
  )
}

function getDefaultFileName(format: RollupFormat) {
  const isESM = /^esm?$/.test(format)
  return format === 'cjs' || isESM
    ? `[name][min][ext]`
    : `[name].[format][min][ext]`
}

export { Config, NormalizedConfig, Options, ConfigOutput }
