import * as rollup from 'rollup'
import watch from 'rollup-watch'
import switchy from 'switchy'
import chalk from 'chalk'
import fancyLog from 'fancy-log'
import merge from 'lodash.merge'
import getRollupOptions from './get-rollup-options'
import getConfig from './get-config'

function log(type, msg, color) {
  if (!color) {
    fancyLog(`${type} ${msg}`)
    return
  }
  fancyLog(`${color(type)} ${msg}`)
}

export default function(options = {}) {
  const userConfig = getConfig(options.config)

  options = merge(
    {
      entry: './src/index.js',
      format: ['cjs'],
      outDir: './dist',
      filename: 'index',
      compress: []
    },
    userConfig,
    options
  )

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
        return new Promise(resolve => {
          const watcher = watch(rollup, rollupOptions)
          watcher.on('event', event => {
            switchy({
              STARTING() {
                log(format, 'starting', chalk.white.bgBlue)
                if (!init) {
                  init = true
                  return resolve()
                }
              },
              BUILD_START() {},
              BUILD_END() {
                log(format, 'bundled successfully', chalk.black.bgGreen)
              },
              ERROR() {
                const error = event.error
                log(format, '', chalk.white.bgRed)
                if (error.snippet) {
                  console.error(chalk.red(`---\n${error.snippet}\n---`))
                }
                console.error(error.stack)
              },
              default() {
                console.error('unknown event', event)
              }
            })(event.code)
          })
        })
      }
      return rollup.rollup(rollupOptions).then(bundle => {
        if (options.write === false) return bundle.generate(rollupOptions)
        return bundle.write(rollupOptions)
      })
    })
  ).then(result => {
    return result.reduce((res, next, i) => {
      res[allFormats[i]] = next
      return res
    }, {})
  })
}
