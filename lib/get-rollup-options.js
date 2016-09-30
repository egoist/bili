'use strict'
const path = require('path')
const camelcase = require('camelcase')
const requireg = require('requireg')

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

module.exports = function (options, format) {
  let compress = false
  if (format === 'umd-compress') {
    format = 'umd'
    compress = true
  }

  let jsCompiler

  // support custom js compiler
  if (options.jsCompiler) {
    if (typeof options.jsCompiler === 'string') {
      jsCompiler = requireg(`bili-${jsCompiler}`)
    } else {
      jsCompiler = options.jsCompiler
    }
  } else {
    const bubleOptions = options.buble || {}
    const transforms = Object.assign({
      generator: false,
      dangerousForOf: true
    }, bubleOptions.transforms)

    delete bubleOptions.transforms

    jsCompiler = require('rollup-plugin-buble')(Object.assign(
      {transforms}, bubleOptions
    ))
  }

  const plugins = [jsCompiler]

  if (options.alias) {
    plugins.push(require('rollup-plugin-alias')(options.alias))
  }

  if (options.replace) {
    plugins.push(require('rollup-plugin-replace')(options.replace))
  }

  // optionally compile async/await to generator function
  if (options.async !== false) {
    plugins.unshift(require('rollup-plugin-async')())
  }

  if (format === 'umd') {
    plugins.push(
      require('rollup-plugin-node-resolve')({
        skip: options.skip,
        jsnext: options.jsnext
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

  return {
    exports: options.exports,
    entry: options.entry,
    paths: options.paths,
    dest: getDest(options, format, compress),
    sourceMap: getMap(options, compress),
    plugins,
    format,
    moduleName
  }
}
