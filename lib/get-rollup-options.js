'use strict'
const path = require('path')
const buble = require('rollup-plugin-buble')
const alias = require('rollup-plugin-alias')
const nodeResolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const uglify = require('rollup-plugin-uglify')
const async = require('rollup-plugin-async')
const replace = require('rollup-plugin-replace')
const pick = require('object-picker')
const camelcase = require('camelcase')

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

  const transforms = Object.assign({
    generator: false,
    dangerousForOf: true
  }, options.transforms)

  const plugins = [
    buble(Object.assign(pick(options, [
      'target',
      'jsx'
    ]), {transforms}))
  ]

  if (options.alias) {
    plugins.push(alias(options.alias))
  }

  if (options.replace) {
    plugins.push(replace(options.replace))
  }

  if (options.async !== false) {
    plugins.unshift(async())
  }

  if (format === 'umd') {
    plugins.push(
      nodeResolve({
        skip: options.skip,
        jsnext: options.jsnext
      }),
      commonjs()
    )
  }

  if (compress) {
    plugins.push(uglify())
  }

  let moduleName = 'index'
  if (options.moduleName) {
    moduleName = options.moduleName
  } else if (options.name) {
    moduleName = camelcase(options.name)
  }

  return {
    exports: options.exports,
    entry: options.entry || './src/index.js',
    paths: options.paths,
    dest: getDest(options, format, compress),
    sourceMap: getMap(options, compress),
    plugins,
    format,
    moduleName
  }
}
