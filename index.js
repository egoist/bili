'use strict'
const rollup = require('rollup').rollup
const buble = require('rollup-plugin-buble')
const alias = require('rollup-plugin-alias')

module.exports = function (options) {
  return rollup({
    entry: options.entry || './src/index.js',
    paths: options.paths,
    plugins: [
      buble(),
      alias(options.alias)
    ]
  }).then(bundle => {
    return bundle.write({
      format: options.format || 'cjs',
      moduleName: options.moduleName,
      dest: options.dest || options.output || './index.js',
      sourceMap: options.sourceMap
    })
  })
}
