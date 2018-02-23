import cac from 'cac'
import Bili from '.'

const cli = cac()

cli
  .command('*', 'Bundle library', async (input, flags) => {
    const options = {
      input,
      ...flags
    }
    if (options.input.length === 0) {
      delete options.input
    }
    if (options.debug) {
      options.logLevel = 4
    } else if (options.quiet) {
      options.logLevel = 1
    }
    return Bili.write(options)
  })
  .option('watch', {
    desc: 'Build and watch files',
    alias: 'w'
  })
  .option('outDir', {
    desc: 'Output directory',
    alias: ['o', 'd']
  })
  .option('moduleName', {
    desc: 'Module name for UMD/IIFE bundle'
  })
  .option('format', {
    desc: 'Output format'
  })
  .option('filename', {
    desc: 'Output filename, default: "[name][suffix].js"'
  })
  .option('name', {
    desc: 'Set the [name] part of "filename"'
  })
  .option('plugin', {
    desc: 'Add custom Rollup plugins'
  })
  .option('jsx', {
    desc: 'Switch JSX syntax, eg: "vue" "h"'
  })
  .option('global', {
    desc:
      'Mark module as global variable. Any module IDs defined here are added to external',
    alias: 'g'
  })
  .option('alias', {
    desc: 'Set option for rollup-plugin-alias'
  })
  .option('replace', {
    desc: 'Set option for rollup-plugin-replace'
  })
  .option('env', {
    desc: 'Replace env variables in your bundle',
    alias: 'e'
  })
  .option('inline', {
    desc: 'Inline external node modules'
  })
  .option('banner', {
    desc:
      'Content to insert to the top of bundle file, boolean or string or object'
  })
  .option('debug', {
    desc: 'Show debug logs'
  })
  .option('quiet', {
    desc: 'Show error logs only'
  })
  .option('no-logUpdate', {
    desc: 'Disable logUpdate'
  })

export default cli
