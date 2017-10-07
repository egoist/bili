/* eslint-disable complexity */
import path from 'path'
import camelcase from 'camelcase'
import req from 'req-cwd'
import stringifyAuthor from 'stringify-author'

function getDest(options, format, compress) {
  const filename = options.filename
  const dir = options.outDir
  let suffix = ''

  if (format === 'cjs') {
    suffix += '.common'
  } else if (format === 'es') {
    suffix += '.es'
  } else if (format === 'iife') {
    suffix += '.iife'
  }

  if (compress) {
    suffix += '.min.js'
  } else {
    suffix += '.js'
  }

  const output = path.join(dir, filename + suffix)
  return output
}

function getMap(options, compress) {
  return compress ? true : options.map
}

export default function(options, format) {
  let compress = false
  if (format.endsWith('Compress')) {
    format = format.replace(/Compress$/, '')
    compress = true
  }

  let plugins = [require('rollup-plugin-json')(options.json)]

  const js = options.js === false ? null : options.js || 'buble'

  let jsOptions = (js && options[js]) || {}

  // Add default options for buble plugin
  if (js === 'buble') {
    const transforms = jsOptions.transforms
    jsOptions = {
      objectAssign: 'Object.assign',
      include: ['**/*.{js,jsx,es6,vue}'],
      ...jsOptions,
      transforms: {
        generator: false,
        dangerousForOf: true,
        dangerousTaggedTemplateString: true,
        ...transforms
      }
    }

    // optionally compile async/await to generator function
    if (js === 'buble' && jsOptions.async !== false) {
      plugins.push(require('rollup-plugin-async')())
    }
  }

  if (options.flow) {
    plugins.push(require('rollup-plugin-flow')())
  }

  if (
    typeof options.plugins === 'object' ||
    typeof options.plugins === 'string'
  ) {
    const _plugins = Array.isArray(options.plugins)
      ? options.plugins
      : [options.plugins]
    const extraPlugins = _plugins.map(p => {
      if (typeof p === 'string') {
        return req(`rollup-plugin-${p}`)(options[p])
      }
      return p
    })
    plugins = [...plugins, ...extraPlugins]
  }

  if (js) {
    let jsPlugin
    try {
      jsPlugin = js === 'buble'
        ? require('rollup-plugin-buble')
        : req(`rollup-plugin-${js}`)
      plugins.push(jsPlugin(jsOptions))
    } catch (err) {
      if (/missing path/.test(err.message)) {
        throw new Error(
          `rollup-plugin-${js} was not found in current working directory!`
        )
      } else {
        throw err
      }
    }
  }

  if (options.alias) {
    plugins.push(require('rollup-plugin-alias')(options.alias))
  }

  if (options.replace) {
    plugins.push(require('rollup-plugin-replace')(options.replace))
  }

  // env is automatically stringified
  if (options.env) {
    const env = Object.keys(options.env).reduce((res, key) => {
      res[`process.env.${key}`] = JSON.stringify(options.env[key])
      return res
    }, {})
    plugins.push(
      require('rollup-plugin-replace')({
        values: env
      })
    )
  }

  if (format === 'umd' || options.resolve) {
    const esModules = options.esModules === undefined ? true : options.esModules
    plugins.push(
      require('rollup-plugin-node-resolve')({
        skip: options.skip,
        jsnext: esModules,
        module: esModules,
        browser: options.browser,
        ...options.nodeResolve
      }),
      require('rollup-plugin-commonjs')(options.commonjs)
    )
  }

  let banner
  if (options.banner) {
    if (typeof options.banner === 'string') {
      banner = options.banner
    } else {
      const pkg = typeof options.banner === 'object'
        ? { ...options.pkg, ...options.banner }
        : options.pkg

      const name = pkg.name

      if (typeof name !== 'string') {
        throw new TypeError(
          `Expect "name" in package.json to be a string but got ${typeof name}.`
        )
      }

      const version = pkg.version ? `v${pkg.version}` : ''
      const year = pkg.year || new Date().getFullYear()

      let author = typeof pkg.author === 'string'
        ? pkg.author
        : typeof pkg.author === 'object' ? stringifyAuthor(pkg.author) : ''
      author = author ? author : ''

      const license = pkg.license || ''

      banner =
        '/*!\n' +
        ` * ${name} ${version}\n` +
        ` * (c) ${year}-present ${author}\n` +
        (license && ` * Released under the ${license} License.\n`) +
        ' */'
    }
  }

  if (compress) {
    plugins.push(
      require('rollup-plugin-uglify')({
        output: {
          // Preserve banner
          preamble: banner
        }
      })
    )
  }

  let moduleName = 'index'
  if (options.moduleName) {
    moduleName = options.moduleName
  } else if (options.filename) {
    moduleName = camelcase(options.filename)
  }

  let external
  if (format === 'cjs') {
    // Exclude .json files in commonjs bundle
    external = id => /\.json$/.test(id)
  }
  external = options.external || external
  if (external && !Array.isArray(external)) {
    external = [external]
  }

  if (typeof options.plugins === 'function') {
    plugins = options.plugins(plugins)
  }

  return {
    input: options.input,
    plugins,
    external,
    output: {
      file: getDest(options, format, compress),
      exports: options.exports,
      name: moduleName,
      paths: options.paths,
      sourcemap: getMap(options, compress),
      format,
      banner
    }
  }
}
