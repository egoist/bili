import * as rollup from 'rollup'
import switchy from 'switchy'
import chalk from 'chalk'
import merge from 'lodash.merge'
import getRollupOptions from './get-rollup-options'
import getConfig from './get-config'
import { handleRollupError } from './utils'
import log from './log'

export default function(options = {}) {
  const userConfig = getConfig(options.config)

  options = merge(
    {
      input: './src/index.js',
      format: ['cjs'],
      outDir: './dist',
      filename: 'index',
      compress: []
    },
    userConfig,
    options
  )

  // for backward-compat
  if (options.entry) {
    options.input = options.entry
  }

  let formats = options.format

  if (typeof formats === 'string') {
    if (formats === 'all') {
      formats = ['cjs', 'umd', 'es']
    } else if (formats.indexOf(',') > -1) {
      formats = formats.split(',').map(v => v.trim())
    } else {
      formats = [formats]
    }
  } else if (!Array.isArray(formats)) {
    throw new TypeError('Expect "format" to be a string or Array')
  }

  // Ensure compress is an array
  if (typeof options.compress === 'string') {
    options.compress = options.compress.split(',').map(v => v.trim())
  } else if (options.compress === true) {
    // Currently uglifyjs cannot compress es format
    options.compress = ['cjs', 'umd', 'iife']
  } else if (!Array.isArray(options.compress)) {
    throw new TypeError('Expect "compress" to be a string/true or Array')
  }

  options.compress = options.compress
    .filter(v => formats.indexOf(v) > -1)
    .map(v => `${v}Compress`)

  const allFormats = [...formats, ...options.compress]

  return Promise.all(
    allFormats.map(format => {
      const rollupOptions = getRollupOptions(options, format)
      if (options.watch) {
        let init
        const watcher = rollup.watch(rollupOptions)
        return watcher.on('event', event => {
          switchy({
            START() {
              log(format, 'starting', chalk.blue)
              if (!init) {
                init = true
              }
            },
            BUNDLE_START() {},
            BUNDLE_END() {
              log(format, 'bundled', chalk.green)
            },
            END() {},
            ERROR() {
              handleRollupError(event.error)
            },
            FATAL() {
              handleRollupError(event.error)
            },
            default() {
              console.error('unknown event', event)
            }
          })(event.code)
        })
      }
      return rollup.rollup(rollupOptions).then(bundle => {
        if (options.write === false)
          return bundle.generate(rollupOptions.output)
        return bundle.write(rollupOptions.output)
      })
    })
  ).then(result => {
    return result.reduce((res, next, i) => {
      res[allFormats[i]] = next
      return res
    }, {})
  })
}
