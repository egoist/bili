import path from 'path'
import globby from 'globby'
import chalk from 'chalk'
import { rollup, watch } from 'rollup'
import readPkg from 'read-pkg-up'
import camelcase from 'camelcase'
import prettyBytes from 'pretty-bytes'
import gzipSize from 'gzip-size'
import stringWidth from 'string-width'
import boxen from 'boxen'
import nodeResolvePlugin from 'rollup-plugin-node-resolve'
import commonjsPlugin from 'rollup-plugin-commonjs'
import jsonPlugin from 'rollup-plugin-json'
import uglifyPlugin from 'rollup-plugin-uglify'
import aliasPlugin from 'rollup-plugin-alias'
import replacePlugin from 'rollup-plugin-replace'
import textTable from 'text-table'
import template from './template'
import getBanner from './get-banner'
import shebangPlugin from './shebang'
import { getBabelConfig, getBiliConfig } from './get-config'

const FORMATS = ['cjs']

export default class Bili {
  static async generate(options) {
    try {
      const bundle = await new Bili(options).bundle({ write: false })
      return bundle
    } catch (err) {
      handleError(err)
    }
  }

  static async write(options) {
    try {
      const bundle = await new Bili(options).bundle()

      if (!options.watch) {
        console.log(await bundle.stats())
      }

      return bundle
    } catch (err) {
      handleError(err)
    }
  }

  constructor(options = {}) {
    this.options = options
    this.bundles = {}
  }

  async stats() {
    const { bundles } = this
    const sizes = await Promise.all(Object.keys(bundles)
      .sort()
      .map(async filepath => {
        const { code, relative } = bundles[filepath]
        return [
          relative,
          prettyBytes(code.length),
          chalk.green(prettyBytes(await gzipSize(code)))
        ]
      }))

    return boxen(textTable(
      [['file', 'size', 'gzip size'].map(v => chalk.bold(v)), ...sizes],
      {
        stringLength: stringWidth
      }
    ))
  }

  getArrayOption(name) {
    const option = this.options[name] || this.options[`${name}s`]
    if (typeof option === 'string') return option.split(',')
    return option
  }

  loadUserPlugins() {
    const plugins = this.getArrayOption('plugin') || []
    return plugins.map(pluginName => {
      return localRequire(`rollup-plugin-${pluginName}`)(this.options[pluginName])
    })
  }

  async createConfig({ input, format, compress }) {
    await Promise.all([
      readPkg().then(res => res.pkg || {}),
      getBiliConfig()
    ]).then(([pkg, biliConfig]) => {
      this.pkg = pkg
      this.options = {
        ...biliConfig,
        ...this.options
      }
    })

    const {
      outDir = 'dist',
      filename = '[name][suffix].js',
      inline = format === 'umd'
    } = this.options

    const file = path.resolve(
      outDir,
      getFilename({
        input,
        format,
        filename,
        compress,
        name: this.options.name
      })
    )

    const jsPluginName = this.options.js || 'babel'
    const jsPlugin = getJsPlugin(jsPluginName)
    const jsOptions = getJsOptions(
      jsPluginName,
      this.options.jsx,
      this.options[jsPluginName]
    )

    const banner = getBanner(this.options.banner, this.pkg)

    let external = this.getArrayOption('external')
    let globals = this.options.globals || this.options.global
    if (typeof globals === 'object') {
      external = [...(external || []), ...Object.keys(globals)]
    }

    const inputOptions = {
      input,
      external,
      onwarn: ({ loc, frame, message, code }) => {
        if (this.options.quiet || code === 'UNRESOLVED_IMPORT') return
        // print location if applicable
        if (loc) {
          console.warn(`${loc.file} (${loc.line}:${loc.column}) ${message}`)
          if (frame) console.warn(frame)
        } else {
          console.warn(message)
        }
      },
      plugins: [
        shebangPlugin(),
        ...this.loadUserPlugins(),
        jsPluginName === 'buble' &&
          require('rollup-plugin-nodent')({
            exclude: 'node_modules/**',
            promises: true,
            noRuntime: true
          }),
        jsPlugin({
          exclude: 'node_modules/**',
          ...jsOptions
        }),
        inline && commonjsPlugin(),
        inline &&
          nodeResolvePlugin({
            module: true
          }),
        jsonPlugin(),
        compress &&
          uglifyPlugin({
            ...this.options.uglify,
            output: {
              ...(this.options.uglify && this.options.uglify.output),
              // Add banner (if there is)
              preamble: banner
            }
          }),
        this.options.alias && aliasPlugin(this.options.alias),
        this.options.replace && replacePlugin(this.options.replace),
        {
          ongenerate: (_, { code }) => {
            this.bundles[file] = {
              relative: path.relative(path.resolve(outDir, '..'), file),
              input,
              format,
              compress,
              code
            }
          }
        },
        this.options.env &&
          replacePlugin({
            values: Object.keys(this.options.env).reduce((res, key) => {
              res[`process.env.${key}`] = JSON.stringify(this.options.env[key])
              return res
            }, {})
          })
      ].filter(v => Boolean(v))
    }

    const outputOptions = {
      format,
      globals,
      name: format === 'umd' && this.getModuleName(),
      file,
      banner,
      sourcemap:
        typeof this.options.map === 'boolean' ? this.options.map : compress
    }

    return {
      inputOptions,
      outputOptions
    }
  }

  async bundle({ write = true } = {}) {
    let inputFiles = this.options.input || 'src/index.js'
    if (Array.isArray(inputFiles) && inputFiles.length === 0) {
      inputFiles = 'src/index.js'
    }
    inputFiles = await globby(inputFiles)

    const formats = this.getArrayOption('format') || FORMATS
    const options = inputFiles.reduce(
      (res, input) => [
        ...res,
        ...formats.map(format => {
          const compress = format.endsWith('-min')
          return {
            input,
            format: format.replace(/-min$/, ''),
            compress
          }
        })
      ],
      []
    )

    const actions = options.map(async option => {
      const { inputOptions, outputOptions } = await this.createConfig(option)

      if (this.options.watch) {
        const watcher = watch({
          ...inputOptions,
          output: outputOptions,
          watch: {
            clearScreen: true
          }
        })
        watcher.on('event', async e => {
          if (e.code === 'ERROR' || e.code === 'FATAL') {
            handleError(e.error)
          }
          if (e.code === 'BUNDLE_END') {
            process.exitCode = 0
            console.log(`${e.input} -> ${path.relative(
              path.resolve(this.options.outDir || 'dist', '..'),
              outputOptions.file
            )}`)
          }
        })
        return
      }
      const bundle = await rollup(inputOptions)
      if (write) return bundle.write(outputOptions)
      return bundle.generate(outputOptions)
    })
    await Promise.all(actions)
    return this
  }

  getModuleName() {
    return (
      this.options.moduleName ||
      this.pkg.moduleName ||
      (this.pkg.name && camelcase(this.pkg.name))
    )
  }
}

function getSuffix(format, compress) {
  let suffix = ''
  switch (format) {
    case 'cjs':
      suffix += '.cjs'
      break
    case 'umd':
      break
    case 'es':
      suffix += '.m'
      break
    default:
      throw new Error('unsupported format')
  }
  return compress ? `${suffix}.min` : suffix
}

function getFilename({ input, format, filename, compress, name }) {
  name = name || path.basename(input, path.extname(input))
  const suffix = getSuffix(format, compress)
  return template(filename, { name, suffix })
}

function getJsOptions(name, jsx, babelConfig) {
  if (name === 'babel') {
    return {
      babelrc: !process.env.BILI_TEST,
      ...getBabelConfig({ jsx }),
      ...babelConfig
    }
  }

  if (name === 'buble') {
    return {
      transforms: {
        dangerousForOf: true,
        dangerousTaggedTemplateString: true
      },
      objectAssign: 'Object.assign'
    }
  }

  return {}
}

function getJsPlugin(name) {
  const req = name === 'babel' || name === 'buble' ? require : localRequire
  return req(`rollup-plugin-${name}`)
}

function localRequire(name) {
  return require(path.resolve('node_modules', name))
}

function handleError(err) {
  process.exitCode = process.exitCode || 1

  if (err.code === 'PLUGIN_ERROR') {
    console.error(chalk.red(`Error found by ${err.plugin} plugin:`))
    if (err.codeFrame) {
      console.error(err.message)
      console.error(err.codeFrame)
    } else {
      console.error(err.stack)
    }
    return
  }

  if (err.message.includes('You must supply options.name for UMD bundles')) {
    console.error('You must supply options.moduleName for UMD bundles, the easiest way is to use --moduleName flag.\n')
    logDocRef('api', 'modulename')
    return
  }

  if (err.frame) {
    console.log(err.frame)
  }
  console.log(err.stack)
}

function logDocRef(page, id) {
  console.log(chalk.dim(`Check out: https://egoist.moe/bili/#/${page}${id ? `?id=${id}` : ''}`))
}
