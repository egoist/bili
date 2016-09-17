'use strict'
const path = require('path')
const rollup = require('rollup').rollup
const buble = require('rollup-plugin-buble')
const alias = require('rollup-plugin-alias')
const nodeResolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const pick = require('object-picker')
const camelcase = require('camelcase')

function getDest(options, format) {
  const name = options.name || 'index'
  const dir = options.outDir || './dist'
  const suffix = format === 'umd' ? '' : '.common'
  const output = path.join(dir, name + suffix + '.js')
  return output
}

module.exports = function (options) {
  let formats = options.format || ['cjs']
  formats = Array.isArray(formats) ? formats : [formats]

  return Promise.all(formats.map(format => {
    const plugins = [
      buble(pick(options, [
        'transforms',
        'target',
        'jsx'
      ])),
      alias(options.alias)
    ]
    if (options.nodeResolve) {
      plugins.push(
        nodeResolve({
          skip: options.skip,
          jsnext: options.jsnext
        }),
        commonjs()
      )
    }
    return rollup({
      entry: options.entry || './src/index.js',
      paths: options.paths,
      plugins
    }).then(bundle => {
      return bundle.write({
        format,
        dest: getDest(options, format),
        moduleName: camelcase(options.moduleName || options.name),
        sourceMap: options.map
      })
    })
  }))
}
