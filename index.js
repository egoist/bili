'use strict'
const path = require('path')
const rollup = require('rollup').rollup
const buble = require('rollup-plugin-buble')
const alias = require('rollup-plugin-alias')
const nodeResolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const uglify = require('rollup-plugin-uglify')
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

module.exports = function (options) {
  options = options || {}
  let formats = options.format || ['cjs']
  formats = Array.isArray(formats) ? formats : [formats]
  if (options.compress) {
    formats.push('umd-compress')
  }

  return Promise.all(formats.map(format => {
    let compress = false
    if (format === 'umd-compress') {
      format = 'umd'
      compress = true
    }
    const plugins = [
      buble(pick(options, [
        'transforms',
        'target',
        'jsx'
      ])),
      alias(options.alias)
    ]
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
    return rollup({
      entry: options.entry || './src/index.js',
      paths: options.paths,
      plugins
    }).then(bundle => {
      return bundle.write({
        format,
        dest: getDest(options, format, compress),
        moduleName: camelcase(options.moduleName || options.name || 'index'),
        sourceMap: getMap(options, compress)
      })
    })
  }))
}
