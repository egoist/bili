import * as rollup from 'rollup'
import watch from 'rollup-watch'
import switchy from 'switchy'
import chalk from 'chalk'
import fancyLog from 'fancy-log'
import merge from 'lodash.merge'
import getRollupOptions from './get-rollup-options'
import getCustomOptions from './get-custom-options'

function log(type, msg, color) {
  if (!color) {
    fancyLog(`${type} ${msg}`)
    return
  }
  fancyLog(`${color(type)} ${msg}`)
}

export default function (options) {
  options = options || {}
  const customOptions = getCustomOptions(options)

  options = merge({
    entry: './src/index.js',
    exports: options.exports || 'default',
    format: ['cjs']
  }, customOptions, options)

  let formats = options.format
  if (!Array.isArray(formats)) {
    formats = [formats]
  }
  if (options.compress) {
    formats.push('umd-compress')
  }

  return Promise.all(formats.map(format => {
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
      return bundle.write(rollupOptions)
    })
  }))
}
