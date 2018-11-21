import util from 'util'
import os from 'os'
import path from 'path'
import crypto from 'crypto'
import EventEmitter from 'events'
import globby from 'globby'
import fs from 'fs-extra'
import chalk from 'chalk'
import { rollup, watch } from 'rollup'
import camelcase from 'camelcase'
import bytes from 'bytes'
import gzipSize from 'gzip-size'
import stringWidth from 'string-width'
import boxen from 'boxen'
import nodeResolvePlugin from 'rollup-plugin-node-resolve'
import commonjsPlugin from 'rollup-plugin-commonjs'
import jsonPlugin from 'rollup-plugin-json'
import { terser as terserPlugin } from 'rollup-plugin-terser'
import aliasPlugin from 'rollup-plugin-alias'
import replacePlugin from 'rollup-plugin-replace'
import hashbangPlugin from 'rollup-plugin-hashbang'
import isBuiltinModule from 'is-builtin-module'
import textTable from 'text-table'
import resolveFrom from 'resolve-from'
import isCI from 'is-ci'
import virtualModulesPlugin from './virtual-modules-plugin'
import progressPlugin from './progress-plugin'
import template from './template'
import getBanner from './get-banner'
import { getBabelConfig, getBiliConfig } from './get-config'
import BiliError from './bili-error'
import { handleError, getDocRef } from './handle-error'
import logger from './logger'
import emoji from './emoji'
import { relativePath } from './util'

const FORMATS = ['cjs']

const prettyBytes = v => bytes.format(v, { unitSeparator: ' ' })

// Make rollup-plugin-vue use basename in component.__file instead of absolute path
// TODO: PR to rollup-plugin-vue to allow this as an API option
process.env.BUILD = 'production'

export default class Bili extends EventEmitter {
  static generate(options) {
    try {
      return new Bili(options).bundle({ write: false })
    } catch (err) {
      handleError(err)
    }
  }

  static async write(options) {
    try {
      const bundler = new Bili(options)
      const startTime = Date.now()
      await bundler.bundle()
      const buildTime = Date.now() - startTime
      const time =
        buildTime < 1000 ?
          `${buildTime}ms` :
          `${(buildTime / 1000).toFixed(2)}s`

      if (!options.watch) {
        logger.status(emoji.success, chalk.green(`Built in ${time}.`))
        logger.log(await bundler.stats())
      }
      return bundler
    } catch (err) {
      handleError(err)
    }
  }

  constructor(options = {}) {
    super()
    logger.setOptions(options)
    this.options = {
      outDir: 'dist',
      filename: '[name][suffix].js',
      cwd: process.cwd(),
      target: 'browser',
      js: null,
      babel: {},
      ...(options.config !== false && getBiliConfig(options.config)),
      ...options
    }
    this.babelPresetOptions = {
      objectAssign: this.options.objectAssign,
      jsx: this.options.jsx,
      target: this.options.target,
      buble: false
    }
    this.options.babel = {
      ...getBabelConfig(
        this.options.cwd,
        this.options.babel.babelrc === false,
        this.babelPresetOptions
      ),
      ...this.options.babel
    }
    this.pkg = readPkg(this.options.cwd)
    this.pkgName = this.pkg.name && this.pkg.name.replace(/^@.+\//, '')
    this.bundles = {}
    this.cssBundles = new Map()

    this.handleError = err => handleError(err)
  }

  async stats() {
    const { bundles } = this
    const { sizeLimit } = this.options
    let leading = ''
    let sizeExceeded = false
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
          sizeExceeded = true
          sizeInfo = chalk.red(` threshold: ${prettyBytes(expectedSize)}`)
        } else {
          sizeInfo = ''
        }
        return [
          relative,
          prettyBytes(code.length),
          chalk.green(prettyBytes(gzipSizeNumber)) + sizeInfo
        ]
      }))

    if (sizeExceeded) {
      leading = chalk.red(`${
        emoji.error
      }  Bundle size exceeded the limit, check below for details.\n`)
    }

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

    return (
      leading +
      boxen(textTable(
        [['file', 'size', 'gzip size'].map(v => chalk.bold(v)), ...sizes],
        {
          stringLength: stringWidth
        }
      ))
    )
  }

  resolveCwd(...args) {
    return path.resolve(this.options.cwd, ...args)
  }

  getJsPlugin(name) {
    let req
    if (isPath(name)) {
      req = require
      name = this.resolveCwd(name)
    } else {
      req =
        name === 'babel' || name === 'buble' ?
          require :
          this.localRequire.bind(this)
      name = `rollup-plugin-${name}`
    }
    try {
      return req(name)
    } catch (err) {
      handleLoadPluginError(name, err)
    }
  }

  localRequire(name) {
    return require(resolveFrom(this.options.cwd, name))
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
        const pluginVuePkg = this.localRequire('rollup-plugin-vue/package')
        const version = parseInt(pluginVuePkg.version)
        if (version < 4) {
          throw new BiliError(`rollup-plugin-vue >= 4 is required!`)
        }
        pluginOptions = {
          include: ['**/*.vue'],
          css: false,
          ...pluginOptions
        }
      }
      const moduleName = isPath(pluginName) ?
        path.resolve(pluginName) :
        `rollup-plugin-${pluginName}`
      try {
        // TODO:
        // Local require is always relative to `process.cwd()`
        // Instead of `this.options.cwd`
        // We need to ensure that which is actually better
        const p = this.localRequire(moduleName)
        return p.default ? p.default(pluginOptions) : p(pluginOptions)
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

  getJsOptions(name, pluginOptions, { cacheId }) {
    if (name === 'babel') {
      return this.options.babel
    }

    if (name === 'typescript' || name === 'typescript2') {
      let typescript
      try {
        typescript = this.localRequire('typescript')
      } catch (err) {}
      const options = {
        typescript,
        ...pluginOptions
      }
      if (name === 'typescript2') {
        options.cacheRoot = path.join(
          os.tmpdir(),
          `.rpt2-${cacheId}`
        )
      }
      return options
    }

    if (name === 'buble') {
      return {
        ...pluginOptions,
        transforms: {
          // Skip transforming for..of
          forOf: false,
          ...(pluginOptions && pluginOptions.transforms)
        }
      }
    }

    return pluginOptions
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

    logger.debug(chalk.bold(`Bili options for ${input} in ${formatFull}:\n`) +
        util.inspect(options, { colors: true }))

    if (typeof options !== 'object') {
      throw new BiliError('You must return the options in `extendOptions` method!')
    }

    if (compress && options.pretty) {
      logger.debug(chalk.bold(`Ignored prettifying (--pretty) ${chalk.cyan(`${formatFull}`)} format`))
    }

    const { outDir, filename } = options

    let inline = options.inline || (format === 'umd' || format === 'iife')
    if (typeof inline === 'string') {
      inline = [inline]
    }

    const sourceMap = typeof options.map === 'boolean' ? options.map : compress

    const outFilename = getFilename({
      input,
      format,
      filename,
      compress,
      // If it's not bundling multi-entry
      // The name can fallback to pkg name
      name: options.name || (!multipleEntries && this.pkgName)
    })
    // The path to output file
    // Relative to `this.options.cwd`
    const file = this.resolveCwd(outDir, outFilename)

    const transformJS = options.js !== false
    const jsPluginName = transformJS && getJsPluginName(options.js, input)
    const jsPlugin = transformJS && this.getJsPlugin(jsPluginName)
    const cacheId = crypto.createHash('md5').update(`bili-output:${file}`).digest('hex')
    const jsOptions =
      transformJS && this.getJsOptions(jsPluginName, options[jsPluginName], { cacheId })

    const banner = getBanner(options.banner, this.pkg)

    let external = getArrayOption(options, 'external') || []
    external = external.map(e => (e.startsWith('./') ? path.resolve(options.cwd, e) : e))
    let globals = options.globals || options.global
    if (typeof globals === 'object') {
      external = [...new Set(external.concat(Object.keys(globals)))]
    }

    let env = options.env
    if (format === 'umd' || format === 'iife') {
      env = {
        NODE_ENV: compress ? 'production' : 'development',
        ...env
      }
    }

    const terserOptions = options.terser || options.uglify || {}
    const prettierOptions = options.prettier || {}
    const pretty = options.pretty && !compress

    const inputOptions = {
      input,
      external,
      onwarn: err => {
        if (options.quiet) return

        if (typeof err === 'string') {
          return logger.warn(err)
        }

        const { loc, frame, message, code, source } = err

        if (options.quiet || code === 'THIS_IS_UNDEFINED') {
          return
        }
        // Unresolved modules
        // If `inline` is not trusty there will always be this warning
        // But we only need this when the module is not installed
        // i.e. does not exist on disk
        if (code === 'UNRESOLVED_IMPORT' && source) {
          if (
            // Skip sub path for now
            source.indexOf('/') === -1 &&
            // Skip built-in modules
            !isBuiltinModule(source) &&
            // Check if the module exists
            resolveFrom.silent(process.cwd(), source) === null
          ) {
            logger.warn(`Module "${source}" was not installed, you may run "${chalk.cyan(`${getPackageManager()} add ${source}`)}" to install it!`)
          }
          return
        }
        // print location if applicable
        if (loc) {
          logger.warn(`${loc.file} (${loc.line}:${loc.column}) ${message}`)
          if (frame) logger.warn(chalk.dim(frame))
        } else {
          logger.warn(message)
        }
      },
      plugins: [
        !isCI &&
          process.stderr.isTTY &&
          process.env.NODE_ENV !== 'test' &&
          options.progress !== false &&
          progressPlugin(),
        hashbangPlugin(),
        options.virtualModules &&
          virtualModulesPlugin(options.virtualModules, this.options.cwd),
        ...this.loadUserPlugins({
          filename: outFilename,
          plugins: getArrayOption(options, 'plugin') || []
        }),
        jsonPlugin(),
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
            include: '**/*.js',
            exclude: 'node_modules/**',
            babelrc: false,
            presets: [
              [
                require.resolve('./babel'),
                {
                  ...this.babelPresetOptions,
                  buble: true
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
            preferBuiltIns: true,
            browser: !options.target.startsWith('node'),
            only: Array.isArray(inline) ? inline : null,
            ...options.nodeResolve
          }),
        commonjsPlugin(options.commonjs),
        compress &&
          terserPlugin({
            ...terserOptions,
            output: {
              ...terserOptions.output,
              // Add banner (if there is)
              preamble: banner
            }
          }),
        pretty &&
          this.localRequire('rollup-plugin-prettier')(prettierOptions),
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
    let inputFiles = this.options.input
    if (!inputFiles || inputFiles.length === 0) {
      inputFiles = ['src/index.js']
    }
    if (!Array.isArray(inputFiles)) {
      inputFiles = [inputFiles]
    }

    const magicPatterns = []
    inputFiles = inputFiles.filter(v => {
      if (globby.hasMagic(v)) {
        magicPatterns.push(v)
        return false
      }
      return true
    })

    await globby(magicPatterns, { cwd: this.options.cwd }).then(files => {
      inputFiles = inputFiles
        .concat(files)
        .map(v => relativePath(this.resolveCwd(v)))
    })

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

      logger.debug(chalk.bold(`Rollup input options for bundling ${option.input} in ${
        option.formatFull
      }:\n`) + util.inspect(inputOptions, { colors: true }))

      logger.debug(chalk.bold(`Rollup output options for bundling ${option.input} in ${
        option.formatFull
      }:\n`) + util.inspect(outputOptions, { colors: true }))

      if (this.options.watch) {
        return new Promise(resolve => {
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
              logger.write(await this.stats())
            }
          })

          // better ensure that `ongenerate` methods run at least once
          // since we will check `bundleCount` later
          // SEE https://github.com/egoist/bili/issues/135
          watcher.on('event', function handler(e) {
            if (e.code === 'BUNDLE_END') {
              watcher.removeListener('event', handler)
              resolve()
            }
          })

          // save watchers to gain more control over them
          this.watchers = this.watchers || []
          this.watchers.push(watcher)
        })
      }

      const bundle = await rollup(inputOptions)
      if (write) return bundle.write(outputOptions)
      return bundle.generate(outputOptions)
    })

    await Promise.all(actions)

    // Since we update `this.bundles` in Rollup plugin's `ongenerate` callback
    // We have to put follow code into another callback to execute at th end of call stack
    await nextTick()
    const bundleCount = Object.keys(this.bundles).length

    if (bundleCount < formats.length * inputFiles.length) {
      const hasName = this.options.filename.includes('[name]')
      const hasSuffix = this.options.filename.includes('[suffix]')
      const msg = `Multiple files are emitting to the same path.\nPlease check if ${
        hasName || inputFiles.length === 1 ?
          '' :
          `${chalk.green('[name]')}${hasSuffix ? '' : ' or '}`
      }${hasSuffix ? '' : chalk.green('[suffix]')} is missing in ${chalk.green('filename')} option.\n${getDocRef('api', 'filename')}`

      throw new BiliError(msg)
    }

    // Write potential CSS files
    await this.writeCSS()

    return this
  }

  getModuleName(format) {
    if (format !== 'umd' && format !== 'iife') return undefined
    return (
      this.options.moduleName ||
      this.pkg.moduleName ||
      (this.pkgName ? camelcase(this.pkgName) : undefined)
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

function isPath(v) {
  return /^[./]|(^[a-zA-Z]:)/.test(v)
}

function handleLoadPluginError(moduleName, err) {
  if (err.code === 'MODULE_NOT_FOUND' && err.message.includes(moduleName)) {
    let msg = `Cannot find plugin "${chalk.cyan(moduleName)}" in current directory!`
    const pm = getPackageManager()
    const command =
      pm === 'yarn' ?
        `yarn add ${moduleName} --dev` :
        `npm install -D ${moduleName}`
    if (!isPath(moduleName)) {
      msg += `\n${chalk.dim(`You may run "${command}" to install it.`)}`
    }
    throw new BiliError(msg)
  } else {
    throw err
  }
}

function nextTick() {
  return new Promise(resolve => {
    process.nextTick(() => {
      resolve()
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

function getJsPluginName(name, input) {
  if (name) {
    return name
  }

  if (input.endsWith('.ts')) {
    return 'typescript2'
  }

  return 'babel'
}
