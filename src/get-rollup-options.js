/* eslint-disable complexity */
import path from 'path'
import camelcase from 'camelcase'
import req from 'req-cwd'

function getDest(options, format, compress) {
  const name = options.name || 'index'
  const dir = options.outDir || './dist'
  let suffix = '.js'
  if (format === 'cjs') {
    suffix = '.common.js'
  } else if (format === 'es') {
    suffix = '.es.js'
  } else if (compress) {
    suffix = '.min.js'
  }
  const output = path.join(dir, name + suffix)
  return output
}

function getMap(options, compress) {
  return compress ? true : options.map
}

export default function (options, format) {
  let compress = false
  if (format === 'umd-compress') {
    format = 'umd'
    compress = true
  }

  let plugins = [
    require('rollup-plugin-json')(options.json)
  ]

  const js = options.js === false ? null : (options.js || 'buble')

  let jsOptions = (js && options[js]) || {}

  // Add default options for buble plugin
  if (js === 'buble') {
    const transforms = jsOptions.transforms
    jsOptions = {
      objectAssign: 'Object.assign',
      include: ['**/*.{js,jsx,es6}'],
      ...jsOptions,
      transforms: {
        generator: false,
        dangerousForOf: true,
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

  if (js) {
    let jsPlugin
    try {
      jsPlugin = js === 'buble' ? require('rollup-plugin-buble') : req(`rollup-plugin-${js}`)
      plugins.push(jsPlugin(jsOptions))
    } catch (err) {
      if (/missing path/.test(err.message)) {
        throw new Error(`rollup-plugin-${js} was not found in current working directory!`)
      } else {
        throw err
      }
    }
  }

  if (options.plugins) {
    const _plugins = Array.isArray(options.plugins) ? options.plugins : [options.plugins]
    const extraPlugins = _plugins.map(p => {
      if (typeof p === 'string') {
        return req(`rollup-plugin-${p}`)(options[p])
      }
      return p
    })
    plugins = [...plugins, ...extraPlugins]
  }

  if (options.alias) {
    plugins.push(require('rollup-plugin-alias')(options.alias))
  }

  if (options.replace) {
    plugins.push(require('rollup-plugin-replace')(options.replace))
  }

  if (format === 'umd' || options.resolve) {
    const esModules = options.esModules === undefined ? true : options.esModules
    plugins.push(
      require('rollup-plugin-node-resolve')({
        skip: options.skip,
        jsnext: esModules,
        module: esModules,
        browser: options.browser
      }),
      require('rollup-plugin-commonjs')(Object.assign({
        include: 'node_modules/**'
      }, options.commonjs))
    )
  }

  let banner
  if (options.banner) {
    if (typeof options.banner === 'string') {
      banner = options.banner
    } else {
      const pkg = typeof options.banner === 'object' ? options.banner : options.pkg
      if (pkg) {
        const name = pkg.name
        const version = pkg.version ? 'v' + pkg.version : ''
        const year = pkg.year || new Date().getFullYear()
        const author = pkg.author ? (pkg.author.name || pkg.author) : ''
        const license = pkg.license || ''
        banner =
          '/*!\n' +
          ` * ${name} ${version}\n` +
          ` * (c) ${year} ${author}\n` +
          (license && ` * Released under the ${license} License.\n`) +
          ' */'
      }
    }
  }

  if (compress) {
    plugins.push(require('rollup-plugin-uglify')({
      output: {
        // Preserve banner
        preamble: banner
      }
    }))
  }

  let moduleName = 'index'
  if (options.moduleName) {
    moduleName = options.moduleName
  } else if (options.name) {
    moduleName = camelcase(options.name)
  }

  let external
  if (format === 'cjs') {
    // Exclude .json files in commonjs bundle
    external = id => /\.json$/.test(id)
  }
  external = options.external || external

  return {
    exports: options.exports,
    entry: options.entry,
    paths: options.paths,
    dest: getDest(options, format, compress),
    sourceMap: getMap(options, compress),
    plugins,
    format,
    moduleName,
    external,
    banner
  }
}
