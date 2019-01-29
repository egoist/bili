import path from 'path'
import colors from 'chalk'
import prettyBytes from 'pretty-bytes'
import textTable from 'text-table'
import gzipSize from 'gzip-size'
import resolveFrom from 'resolve-from'
import boxen from 'boxen'
import stringWidth from 'string-width'
import {
  rollup,
  watch,
  InputOptions,
  OutputOptions,
  Plugin as RollupPlugin
} from 'rollup'
import merge from 'lodash/merge'
import waterfall from 'p-waterfall'
import spinner from './spinner'
import logger from './logger'
import nodeResolvePlugin from './plugins/node-resolve'
import progressPlugin from './plugins/progress'
import configLoader from './config-loader'
import isExternal from './utils/is-external'
import getBanner, { Banner } from './utils/get-banner'
import { BUILTIN_PLUGINS } from './constants'

// Make rollup-plugin-vue use basename in component.__file instead of absolute path
// TODO: PR to rollup-plugin-vue to allow this as an API option
process.env.BUILD = 'production'

type RollupFormat = 'cjs' | 'esm' | 'umd' | 'iife'
type Format = RollupFormat | 'cjs-min' | 'esm-min' | 'umd-min' | 'iife-min'
type Env = {
  [k: string]: string | number | boolean
}

type External = string | RegExp | ((id: string) => boolean)

type Externals = Array<External>

type ConfigEntryObject = { [entryName: string]: string }

interface RunOptions {
  write?: boolean
  watch?: boolean
}

interface RunContext {
  unresolved: Set<string>
}

interface Task {
  title: string
  getConfig(context: RunContext, task: Task): Promise<RollupConfigOutput>
}

type ExtendConfig = (
  config: NormalizedConfig,
  { format, input }: { format: Format; input: string[] | ConfigEntryObject }
) => NormalizedConfig

export interface BabelPresetOptions {
  /**
   * Transform `async/await` to `Promise`.
   * @default `true`
   */
  asyncToPromises?: boolean
  /**
   * Custom JSX pragma. If you want to use Preact, set it to `h`.
   */
  jsx?: string
  /**
   * Replace `Object.assign` with your own method.
   * @example `myAssign`
   */
  objectAssign?: string
  /**
   * Disable .babelrc
   * By default Bili reads it
   */
  babelrc?: boolean
  /**
   * Disable babel.config.js
   */
  configFile?: boolean
}

interface ConfigOutput {
  /**
   * Output format(s). You can append `min` to the format to generate minified bundle.
   *
   * @default `cjs`
   * @values `cjs` `esm` `umd` `iife` `$format-min`
   * @cli `--format <format>`
   */
  format?: Format | Format[]
  /**
   * Output directory
   * @default `dist`
   * @cli `-d, --out-dir <dir>`
   */
  dir?: string
  /**
   * Output file name
   *
   * Default value:
   * - `[name][min].js` in `cjs` format
   * - `[name][min].mjs` in `esm` format
   * - `[name][min].[format].js` in `umd` and `iife` formats.
   *
   * Placeholders:
   * - `[name]`: The base name of input file. (without extension)
   * - `[format]`: The output format. (without `-min` suffix)
   * - `[min]`: It will replaced by `.min` when the format ends with `-min`, otherwise it's an empty string.
   * @cli `--file-name <fileName>`
   */
  fileName?: string
  /**
   * Module name for umd bundle
   */
  moduleName?: string
  /**
   * Whether to minify output files regardless of format, using this option won't add `.min` suffix to the output file name.
   */
  minify?: boolean
  /**
   * Extract CSS into a single file.
   * @default `true`
   */
  extractCSS?: boolean
}

export interface Config {
  /**
   * Input files
   * @default `src/index.js`
   * @cli `bili [...input]`
   */
  input?: string | ConfigEntryObject | Array<ConfigEntryObject | string>
  output?: ConfigOutput
  /**
   * Define env variables that are only available in your library code. i.e. if you have some code like this in your library.
   *
   * ```js
   * if (process.env.NODE_ENV === 'development') {
   *   console.log('debug')
   * }
   * ```
   *
   * And you can run following command to replace the env variable:

   * ```bash
   * bili --env.NODE_ENV production
   * ```
   *
   * By default we don't add any env variables.
   *
   * @cli `--env.<name> value`
   */
  env?: Env
  /**
   * Use Rollup plugins
   *
   * ```js
   * // bili.config.js
   * module.exports = {
   *   plugins: {
   *     svelte: {
   *      // Any options for rollup-plugin-svelte
   *     }
   *   }
   * }
   * ```
   *
   * You can also use CLI flags to add plugins, e.g.
   * ```bash
   * bili --plugin.svelte
   * # with option
   * bili --plugin.svelte.foo bar
   * # Same as using `svelte: { foo: 'bar' }` in config file
   * ```
   *
   * @cli `--plugin.<name> [option]`
   */
  plugins?: {
    [name: string]: any
  }
  /**
   * Include node modules in the bundle. Note that this is always `true` for UMD bundle.
   */
  bundleNodeModules?: boolean | string[]
  /**
   * When inlining node modules
   * You can use this option to exclude specific modules
   */
  externals?: Externals
  /**
   * Specifies `moduleId: variableName` pairs necessary for external imports in umd/iife bundles. For example, in a case like this...
   *
   * ```js
   * import $ from 'jquery'
   * ```
   *
   * ...you can map the `jquery` module ID to the global `$` variable:
   *
   * ```js
   * // bili.config.js
   * export default {
   *   globals: {
   *     jquery: '$'
   *   }
   * }
   * ```
   *
   * @cli `--global.<moduleId> <variableName`
   */
  globals?: {
    [k: string]: string
  }
  /**
   * Insert a copyright message to the top of output bundle.
   */
  banner?: Banner
  /**
   * Configure the default babel preset
   */
  babel?: BabelPresetOptions
  extendConfig?: ExtendConfig
}

export interface Options {
  /**
   * Log level
   */
  logLevel?: 'verbose' | 'quiet'
  /**
   * Always show stack trace
   */
  stackTrace?: boolean
  /**
   * Use a custom config file rather than auto-loading bili.config.js
   */
  configFile?: string | boolean
  rootDir?: string
}

export interface NormalizedConfig {
  input?: string | ConfigEntryObject | Array<ConfigEntryObject | string>
  output: Overwrite<
    ConfigOutput,
    {
      dir: string
    }
  >
  env?: Env
  bundleNodeModules?: boolean | string[]
  plugins: {
    [name: string]: any
  }
  externals: Externals
  globals?: {
    [k: string]: string
  }
  banner?: Banner
  babel: BabelPresetOptions
  extendConfig?: ExtendConfig
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
                    '.bilirc.ts'
                  ],
            cwd: this.rootDir
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
    const minify = config.output.minify || format.endsWith('-min')
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
      format === 'umd' || format === 'iife' || config.bundleNodeModules

    plugins.push(
      nodeResolvePlugin({
        bundleNodeModules,
        rootDir: this.rootDir,
        externals: config.externals
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

    if (source.hasTs && config.plugins.typescript2 !== false) {
      plugins.push(
        this.localRequire('rollup-plugin-typescript2')({
          objectHashIgnoreUnknownHack: true,
          tsconfigOverride: {
            compilerOptions: {
              module: 'esnext'
            }
          }
        })
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

    plugins.push(
      require('rollup-plugin-postcss')(
        Object.assign({}, config.plugins.postcss, {
          extract: config.output.extractCSS !== false
        })
      )
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
    plugins.push({
      name: 'record-bundle',
      generateBundle(outputOptions, _assets) {
        logger.success(title.replace('Bundle', 'Bundled'))
        const VALID_EXT_RE = /\.(js|css)$/
        for (const fileName of Object.keys(_assets)) {
          if (VALID_EXT_RE.test(fileName)) {
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
      async writeBundle() {
        await printAssets(assets)
      }
    })

    const fileName =
      format === 'cjs'
        ? `[name][min].js`
        : format === 'esm'
        ? `[name][min].mjs`
        : `[name].[format][min].js`

    return {
      inputConfig: {
        input: source.input,
        plugins,
        external: Object.keys(config.globals || {}),
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
        entryFileNames: fileName.replace(/\[min\]/, minPlaceholder),
        name: config.output.moduleName,
        banner
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
    } else {
      format = [format || 'cjs']
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
        await waterfall(
          tasks.map(task => () => {
            return this.build(task, context, options.write)
          }),
          context
        )
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

async function printAssets(assets: Assets) {
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
  logger.log(
    boxen(
      textTable(table, {
        stringLength: stringWidth
      })
    )
  )
}
