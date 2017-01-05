import path from 'path'
import camelcase from 'camelcase'
import req from 'req-cwd'

function getDest(options, format, compress) {
  const name = options.name || 'index'
  const dir = options.outDir || './dist'
  let suffix = '.js'
  if (format === 'cjs') {
    suffix = '.common.js'
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

  const plugins = []

  const js = options.js || 'buble'
  const jsPlugin = js === 'buble' ? require('rollup-plugin-buble') : req(`rollup-plugin-${js}`)
  let jsOptions = options[js] || {}

  // add default options for buble plugin
  if (js === 'buble') {
    const transforms = jsOptions.transforms
    delete jsOptions.transforms
    jsOptions = {
      transforms: {
        generator: false,
        dangerousForOf: true,
        ...transforms
      },
      ...jsOptions
    }
  }

  // for buble
  // optionally compile async/await to generator function
  if (js === 'buble' && jsOptions.async !== false) {
    plugins.push(require('rollup-plugin-async')())
  }

  if (options.flow) {
    plugins.push(require('rollup-plugin-flow')())
  }

  plugins.push(jsPlugin(jsOptions))

  if (options.alias) {
    plugins.push(require('rollup-plugin-alias')(options.alias))
  }

  if (options.replace) {
    plugins.push(require('rollup-plugin-replace')(options.replace))
  }

  if (format === 'umd') {
    plugins.push(
      require('rollup-plugin-node-resolve')({
        skip: options.skip,
        jsnext: options.jsnext,
        browser: options.browser
      }),
      require('rollup-plugin-commonjs')()
    )
  }

  if (compress) {
    plugins.push(require('rollup-plugin-uglify')())
  }

  let moduleName = 'index'
  if (options.moduleName) {
    moduleName = options.moduleName
  } else if (options.name) {
    moduleName = camelcase(options.name)
  }

  let external
  if (format === 'cjs') {
    // exclude .json files in commonjs bundle
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
    external
  }
}
