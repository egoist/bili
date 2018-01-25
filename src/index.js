import util from 'util'
import path from 'path'
import EventEmitter from 'events'
import globby from 'globby'
import fs from 'fs-extra'
import chalk from 'chalk'
import { rollup, watch } from 'rollup'
import logUpdate from 'log-update'
import camelcase from 'camelcase'
import bytes from 'bytes'
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
import isCI from 'is-ci'
import progressPlugin from './progress-plugin'
import template from './template'
import getBanner from './get-banner'
import { getBabelConfig } from './get-config'
import BiliError from './bili-error'
import { handleError, getDocRef } from './handle-error'
import { logAndPersist } from './utils'

const FORMATS = ['cjs']

const prettyBytes = v => bytes.format(v, { unitSeparator: ' ' })

export default class Bili extends EventEmitter {
  static async generate(options) {
    const bundle = await new Bili(options).bundle({ write: false })
    return bundle
  }

  static async write(options) {
    const bundle = await new Bili(options).bundle()

    if (!options.watch) {
      logAndPersist(await bundle.stats())
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
    this.pkg = readPkg(this.options.cwd)
    this.bundles = {}
    this.cssBundles = new Map()
  }

  async stats() {
    const { bundles } = this
    const { sizeLimit } = this.options
    const sizes = await Promise.all(Object.keys(bundles)
      .sort()
      .map(async filepath => {
        const { code, relative, formatFull } = bundles[filepath]
        const gzipSizeNumber = await gzipSize(code)
        const expectedSize =
            sizeLimit &&
            sizeLimit[formatFull] &&
            bytes.parse(sizeLimit[formatFull])
        let sizeInfo
        if (expectedSize && gzipSizeNumber > expectedSize) {
          process.exitCode = 1
          sizeInfo = chalk.red(` threshold: ${sizeLimit[formatFull]}`)
        } else {
          sizeInfo = ''
        }
        return [
          relative,
          prettyBytes(code.length),
          chalk.green(prettyBytes(gzipSizeNumber)) + sizeInfo
        ]
      }))

    await Promise.all(Array.from(this.cssBundles.keys())
      .sort()
      .map(async id => {
        const bundle = this.cssBundles.get(id)
        sizes.push([
          path.relative(process.cwd(), bundle.filepath),
          prettyBytes(bundle.code.length),
          chalk.green(prettyBytes(await gzipSize(bundle.code)))
        ])
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
          include: ['**/*.vue'],
          css: path.resolve(
            this.options.outDir,
            filename.replace(/\.[^.]+$/, '.css')
          ),
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

  async writeCSS() {
    await Promise.all(Array.from(this.cssBundles.keys()).map(id => {
      const { code, map, filepath } = this.cssBundles.get(id)
      return Promise.all([
        fs.writeFile(filepath, code, 'utf8'),
        map && fs.writeFile(`${filepath}.map`, map, 'utf8')
      ])
    }))
  }

  // eslint-disable-next-line complexity
  async createConfig(
    { input, format, formatFull, compress },
    { multipleEntries }
  ) {
    const options = this.options.extendOptions ?
      this.options.extendOptions(this.options, {
        input,
        format,
        compress
      }) :
      this.options

    if (options.inspectOptions) {
      console.log(chalk.bold(`Bili options for ${input} in ${format}:`))
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

    const sourceMap = typeof options.map === 'boolean' ? options.map : compress

    const outFilename = getFilename({
      input,
      format,
      filename,
      compress,
      // If it's not bundling multi-entry
      // The name can fallback to pkg name
      name: options.name || (!multipleEntries && this.pkg.name)
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

    let env = options.env
    if (format === 'umd' || format === 'iife') {
      env = {
        NODE_ENV: compress ? 'production' : 'development',
        ...env
      }
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
            logAndPersist(
              '😒 ',
              `Module "${source}" was not installed, you may run "${chalk.cyan(`${getPackageManager()} add ${source}`)}" to install it!`
            )
          }
          return
        }
        // print location if applicable
        if (loc) {
          logAndPersist(`${loc.file} (${loc.line}:${loc.column}) ${message}`)
          if (frame) logAndPersist(chalk.dim(frame))
        } else {
          logAndPersist('🙋‍♂️ ', message)
        }
      },
      plugins: [
        !isCI &&
          process.stderr.isTTY &&
          process.env.NODE_ENV !== 'test' &&
          options.progress !== false &&
          progressPlugin(),
        hashbangPlugin(),
        ...this.loadUserPlugins({
          filename: outFilename,
          plugins: getArrayOption(options, 'plugin') || []
        }),
        require('rollup-plugin-postcss')({
          extract: true,
          minimize: compress,
          sourceMap,
          ...options.postcss,
          onExtract: getExtracted => {
            // Use `z` `a` to ensure the order when we log the stats
            const id = `${input}::${compress ? 'z-compressed' : 'a-normal'}`
            if (!this.cssBundles.has(id)) {
              // Don't really need suffix for format
              const filepath = this.resolveCwd(
                outDir,
                outFilename.replace(
                  /(\.(iife|cjs|es))?(\.min)?\.js$/,
                  compress ? '.min.css' : '.css'
                )
              )
              const bundle = getExtracted(filepath)

              this.cssBundles.set(id, {
                ...bundle,
                filepath
              })
            }
            // We extract CSS but never atually let `rollup-plugin-postcss` write to disk
            // To prevent from duplicated css files
            return false
          }
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
                  objectAssign: options.objectAssign
                }
              ]
            ],
            // Your can still set babel options while using buble
            ...options.babel
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
            preferBuiltIns: true,
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
              relative: path.relative(process.cwd(), file),
              input,
              format,
              formatFull,
              compress,
              code
            }
          }
        },
        env &&
          Object.keys(env).length > 0 &&
          replacePlugin({
            values: Object.keys(env).reduce((res, key) => {
              res[`process.env.${key}`] = JSON.stringify(env[key])
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
      sourcemap: sourceMap
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

    inputFiles = await globby(inputFiles, { cwd: this.options.cwd }).then(res =>
      res.map(v => this.relativeToProcessCwd(v)))

    if (inputFiles.length === 0) {
      throw new BiliError('No matched files to bundle.')
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
            formatFull: format,
            compress
          }
        })
      ],
      []
    )

    const multipleEntries = inputFiles.length > 1
    const actions = options.map(async option => {
      const { inputOptions, outputOptions } = await this.createConfig(option, {
        multipleEntries
      })

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
            logUpdate(await this.stats())
          }
        })
        return
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

    // Write potential CSS files
    await this.writeCSS()

    return this
  }

  getModuleName(format) {
    if (format !== 'umd' && format !== 'iife') return undefined
    return (
      this.options.moduleName ||
      this.pkg.moduleName ||
      (this.pkg.name ? camelcase(this.pkg.name) : undefined)
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
      suffix += '.es'
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
      babelrc: process.env.NODE_ENV !== 'test',
      ...getBabelConfig({ jsx }),
      ...jsOptions
    }
  }

  if (name === 'typescript' || name === 'typescript2') {
    let typescript
    try {
      typescript = localRequire('typescript')
    } catch (err) {}
    return {
      typescript,
      ...jsOptions
    }
  }

  if (name === 'buble') {
    return {
      ...jsOptions,
      transforms: {
        // Skip transforming for..of
        forOf: false,
        ...(jsOptions && jsOptions.transforms)
      }
    }
  }

  return jsOptions
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

function readPkg(cwd = process.cwd()) {
  try {
    return require(path.resolve(cwd, 'package.json'))
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      return {}
    }
    throw err
  }
}
