import util from 'util'
import os from 'os'
import url from 'url'
import http from 'http'
import path from 'path'
import EventEmitter from 'events'
import globby from 'globby'
import fs from 'fs-extra'
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
import hashbangPlugin from 'rollup-plugin-hashbang'
import isBuiltinModule from 'is-builtin-module'
import textTable from 'text-table'
import template from './template'
import getBanner from './get-banner'
import { getBabelConfig } from './get-config'
import BiliError from './bili-error'
import { handleError, getDocRef } from './handle-error'

const FORMATS = ['cjs']
const SERVE_DIR = path.join(os.tmpdir(), `.bili`)

export default class Bili extends EventEmitter {
  static async generate(options) {
    const bundle = await new Bili(options).bundle({ write: false })
    return bundle
  }

  static async write(options) {
    const bundle = await new Bili(options).bundle()

    if (!options.watch && !options.serve) {
      console.log(await bundle.stats())
    }

    return bundle
  }

  static handleError(err) {
    return handleError(err)
  }

  constructor(options = {}) {
    super()
    this.options = {
      outDir: 'dist',
      filename: '[name][suffix].js',
      uglifyEs: true,
      cwd: process.cwd(),
      ...options
    }
    this.bundles = {}

    if (this.options.serve) {
      this.options.watch = true
      this.options.outDir = SERVE_DIR
      this.options.format = 'iife'
      this.options.port =
            typeof this.options.port === 'number' ? this.options.port : 2018
      this.options.env = {
        ...this.options.env,
        NODE_ENV: 'development'
      }
      console.warn(`🙅  Output dir is forced to be OS tmp dir in "serve" mode`)
      console.warn(`🙅  Bundle format is forced to be: "iife" in "serve" mode`)
    }
  }

  async serve() {
    const serveStatic = require('serve-static')
    const finalHandler = require('finalhandler')

    const serve = serveStatic(this.options.outDir, {
      index: ['index.html']
    })

    const localHTML = path.resolve('index.html')
    const hasLocalHTML = await fs.pathExists(localHTML)
    const htmlFile =
      this.options.html ||
      (hasLocalHTML && localHTML) ||
      path.join(__dirname, '../app/index.html')
    console.log(`🔔  Using HTML file at ${chalk.green(path.relative(process.cwd(), htmlFile))}`)

    const server = http.createServer(async (req, res) => {
      if (url.parse(req.url).pathname === '/') {
        const html = await fs.readFile(htmlFile, 'utf8')
        return res.end(await renderHTML(html, this.pkg))
      }
      serve(req, res, finalHandler(req, res))
    })
    server.listen(this.options.port)
    this.once('BUNDLE_START', () => {
      console.log('📦  Starting...')
    })
    this.once('BUNDLE_END', () => {
      console.log(`🔗  http://localhost:${this.options.port}`)
    })
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

  resolveCwd(...args) {
    return path.resolve(this.options.cwd, ...args)
  }

  relativeToProcessCwd(...args) {
    return path.relative(process.cwd(), this.resolveCwd(...args))
  }

  loadUserPlugins({ plugins, filename }) {
    // eslint-disable-next-line array-callback-return
    return plugins.map(pluginName => {
      // In bili.config.js or you're using the API
      // You can require rollup plugin directly
      if (typeof pluginName === 'object') {
        return pluginName
      }

      let pluginOptions = this.options[pluginName]
      if (pluginName === 'vue') {
        pluginOptions = {
          css: path.resolve(
            this.options.outDir,
            filename.replace(/\.[^.]+$/, '.css')
          ),
          ...pluginOptions
        }
      } else if (pluginName === 'postcss') {
        pluginOptions = {
          extract: true,
          ...pluginOptions
        }
      }
      const moduleName = `rollup-plugin-${pluginName}`
      try {
        // TODO:
        // Local require is always relative to `process.cwd()`
        // Instead of `this.options.cwd`
        // We need to ensure that which is actually better
        return localRequire(moduleName)(pluginOptions)
      } catch (err) {
        handleLoadPluginError(moduleName, err)
      }
    })
  }

  // eslint-disable-next-line complexity
  async createConfig({ input, format, compress }) {
    const options = this.options.extendOptions ?
      this.options.extendOptions(this.options, {
        input,
        format,
        compress
      }) :
      this.options

    if (options.inspectOptions) {
      console.log(`Bili options for ${input} in ${format}:`)
      console.log(util.inspect(options, { colors: true }))
    }

    if (typeof options !== 'object') {
      throw new BiliError('You must return the options in `extendOptions` method!')
    }

    const {
      outDir,
      filename,
      inline = format === 'umd' || format === 'iife'
    } = options

    const outFilename = getFilename({
      input,
      format,
      filename,
      compress,
      name: options.name
    })
    // The path to output file
    // Relative to `this.options.cwd`
    const file = this.resolveCwd(outDir, outFilename)

    const transformJS = options.js !== false
    const jsPluginName = transformJS && (options.js || 'buble')
    const jsPlugin = transformJS && getJsPlugin(jsPluginName)
    const jsOptions =
      transformJS &&
      getJsOptions(jsPluginName, options.jsx, options[jsPluginName])

    const banner = getBanner(options.banner, this.pkg)

    let external = getArrayOption(options, 'external') || []
    external = external.map(e => (e.startsWith('./') ? path.resolve(e) : e))
    let globals = options.globals || options.global
    if (typeof globals === 'object') {
      external = [...external, ...Object.keys(globals)]
    }

    const inputOptions = {
      input,
      external,
      onwarn: ({ loc, frame, message, code, source }) => {
        if (options.quiet || code === 'THIS_IS_UNDEFINED') {
          return
        }
        // Unresolved modules
        // If `inline` is not trusty there will always be this warning
        // But we only need this when the module is not installed
        // i.e. does not exist on disk
        if (code === 'UNRESOLVED_IMPORT' && source) {
          if (
            !isBuiltinModule(source) &&
            !fs.existsSync(path.resolve('node_modules', source))
          ) {
            console.warn(
              '😒 ',
              `Module "${source}" was not installed, you may run "${chalk.cyan(`${getPackageManager()} add ${source}`)}" to install it!`
            )
          }
          return
        }
        // print location if applicable
        if (loc) {
          console.warn(`${loc.file} (${loc.line}:${loc.column}) ${message}`)
          if (frame) console.warn(chalk.dim(frame))
        } else {
          console.warn('🙋‍♂️ ', message)
        }
      },
      plugins: [
        hashbangPlugin(),
        ...this.loadUserPlugins({
          filename: outFilename,
          plugins: getArrayOption(options, 'plugins') || []
        }),
        transformJS &&
          jsPluginName === 'buble' &&
          require('rollup-plugin-babel')({
            babelrc: false,
            exclude: 'node_modules/**',
            presets: [
              [
                require.resolve('./babel'),
                {
                  buble: true,
                  jsx: options.jsx,
                  objectAssign: jsOptions.objectAssign
                }
              ]
            ]
          }),
        transformJS &&
          jsPlugin({
            exclude: 'node_modules/**',
            ...jsOptions
          }),
        inline &&
          nodeResolvePlugin({
            module: true,
            extensions: ['.js', '.json'],
            ...options.nodeResolve
          }),
        inline && commonjsPlugin(options.commonjs),
        jsonPlugin(),
        compress &&
          uglifyPlugin(
            {
              ...options.uglify,
              output: {
                ...(options.uglify && options.uglify.output),
                // Add banner (if there is)
                preamble: banner
              }
            },
            options.uglifyEs ? require('uglify-es').minify : undefined
          ),
        options.alias && aliasPlugin(options.alias),
        options.replace && replacePlugin(options.replace),
        {
          name: 'bili',
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
        options.env &&
          replacePlugin({
            values: Object.keys(options.env).reduce((res, key) => {
              res[`process.env.${key}`] = JSON.stringify(options.env[key])
              return res
            }, {})
          })
      ].filter(v => Boolean(v))
    }

    const outputOptions = {
      format,
      globals,
      name: this.getModuleName(format),
      file,
      banner,
      exports: options.exports,
      sourcemap: typeof options.map === 'boolean' ? options.map : compress
    }

    return {
      inputOptions,
      outputOptions
    }
  }

  async bundle({ write = true } = {}) {
    this.pkg = await readPkg({ cwd: this.options.cwd }).then(res => res.pkg || {})

    let inputFiles = this.options.input || 'src/index.js'
    if (Array.isArray(inputFiles) && inputFiles.length === 0) {
      inputFiles = 'src/index.js'
    }

    inputFiles = await globby(inputFiles, { cwd: this.options.cwd }).then(res =>
      res.map(v => this.relativeToProcessCwd(v)))

    if (inputFiles.length === 0) {
      throw new BiliError('No matched files to bundle.')
    }

    if (this.options.serve) {
      await fs.remove(SERVE_DIR)
      await this.serve()
    }

    const formats = getArrayOption(this.options, 'format') || FORMATS

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
          if (e.code === 'BUNDLE_START') {
            this.emit(e.code)
          }
          if (e.code === 'BUNDLE_END') {
            process.exitCode = 0
            const outputPath = this.options.serve ?
              `${chalk.dim('<tmp>/')}${path.relative(
                path.resolve(this.options.outDir),
                outputOptions.file
              )}` :
              path.relative(
                path.resolve(this.options.outDir, '..'),
                outputOptions.file
              )
            console.log(`📦  ${e.input} -> ${outputPath}`)
            this.emit(e.code)
          }
        })
        return
      }

      if (this.options.inspectRollup) {
        console.log(
          chalk.bold(`Rollup input options for bundling ${option.input} in ${
            option.format
          }:\n`),
          util.inspect(inputOptions, { colors: true })
        )
        console.log(
          chalk.bold(`Rollup output options for bundling ${option.input} in ${
            option.format
          }:\n`),
          util.inspect(outputOptions, { colors: true })
        )
      }

      const bundle = await rollup(inputOptions)
      if (write) return bundle.write(outputOptions)
      return bundle.generate(outputOptions)
    })

    await Promise.all(actions)

    // Since we update `this.bundles` in Rollup plugin's `ongenerate` callback
    // We have to put follow code into another callback to execute at th end of call stack
    await nextTick(() => {
      const bundleCount = Object.keys(this.bundles).length
      if (bundleCount > 0 && bundleCount < formats.length * inputFiles.length) {
        const hasName = this.options.filename.includes('[name]')
        const hasSuffix = this.options.filename.includes('[suffix]')
        const msg = `Multiple files are emitting to the same path.\nPlease check if ${
          hasName || inputFiles.length === 1 ?
            '' :
            `${chalk.green('[name]')}${hasSuffix ? '' : ' or '}`
        }${
          hasSuffix ? '' : chalk.green('[suffix]')
        } is missing in ${chalk.green('filename')} option.\n${getDocRef(
          'api',
          'filename'
        )}`
        throw new BiliError(msg)
      }
    })

    return this
  }

  getModuleName(format) {
    if (format !== 'umd' && format !== 'iife') return null
    if (format === 'iife') return 'MyBundle'

    return (
      this.options.moduleName ||
      this.pkg.moduleName ||
      (this.pkg.name && camelcase(this.pkg.name))
    )
  }
}

function getSuffix(format) {
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
    case 'iife':
      suffix += '.iife'
      break
    default:
      throw new Error('unsupported format')
  }
  return suffix
}

function getNameFromInput(input) {
  return path.basename(input, path.extname(input))
}

function getFilename({ input, format, filename, compress, name }) {
  name = name || getNameFromInput(input)
  const suffix = getSuffix(format)
  const res = template(filename, { name, suffix })
  return compress ?
    path.basename(res, path.extname(res)) + '.min' + path.extname(res) :
    res
}

function getJsOptions(name, jsx, jsOptions) {
  if (name === 'babel') {
    return {
      babelrc: !process.env.BILI_TEST,
      ...getBabelConfig({ jsx }),
      ...jsOptions
    }
  }

  if (name === 'buble') {
    return {
      // objectAssign: 'Object.assign',
      // We no longer need "objectAssign" for buble
      // Since we transform object rest spread with babel
      // And replace objectAssign there
      ...jsOptions,
      transforms: {
        dangerousForOf: true,
        dangerousTaggedTemplateString: true,
        ...(jsOptions && jsOptions.transforms)
      }
    }
  }

  if (name === 'typescript') {
    let typescript
    try {
      typescript = localRequire('typescript')
    } catch (err) {}
    return {
      typescript,
      ...jsOptions
    }
  }

  return {}
}

function getJsPlugin(name) {
  const req = name === 'babel' || name === 'buble' ? require : localRequire
  const moduleName = `rollup-plugin-${name}`
  try {
    return req(moduleName)
  } catch (err) {
    handleLoadPluginError(moduleName, err)
  }
}

function localRequire(name) {
  return require(path.resolve('node_modules', name))
}

function handleLoadPluginError(moduleName, err) {
  if (err.code === 'MODULE_NOT_FOUND' && err.message.includes(moduleName)) {
    throw new BiliError(`Cannot find plugin "${moduleName}" in current directory!\n${chalk.dim(`You may run "npm install -D ${moduleName}" to install it.`)}`)
  } else {
    throw err
  }
}

function nextTick(fn) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        fn()
        resolve()
      } catch (err) {
        reject(err)
      }
    })
  })
}

function getArrayOption(options, name) {
  const option = options[name] || options[`${name}s`]
  if (typeof option === 'string') return option.split(',')
  return option
}

let packageManager

function getPackageManager() {
  if (packageManager) return packageManager
  packageManager = fs.existsSync('yarn.lock') ? 'yarn' : 'npm'
  return packageManager
}

async function renderHTML(html, pkg) {
  const files = await globby('*.{js,css}', { cwd: SERVE_DIR })
  const js = files
    .filter(file => file.endsWith('.js'))
    .map(file => `<script src="${file}"></script>`)
    .join('\n')
  const css = files
    .filter(file => file.endsWith('.css'))
    .map(file => `<link rel="stylesheet" href="${file}" />`)
    .join('\n')
  return html
    .replace('<!--%JS%-->', js)
    .replace('<!--%CSS%-->', css)
    .replace('<!--%title%-->', pkg.name)
}
