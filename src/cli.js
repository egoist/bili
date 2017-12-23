#!/usr/bin/env node
import cac from 'cac'
import Bili from '.'

const cli = cac()

cli
  .command('*', 'Bundle library', (input, flags) => {
    return Bili.write({
      input,
      ...flags
    })
  })
  .option('watch', {
    desc: 'Run in watch mode'
  })
  .option('outDir', {
    desc: 'Output directory',
    alias: 'd'
  })
  .option('filename', {
    desc: 'Output filename, default: "[name][suffix].js"'
  })
  .option('name', {
    desc: 'Set the [name] part of "filename"'
  })
  .option('format', {
    desc: 'Output format'
  })
  .option('plugin', {
    desc: 'Add custom Rollup plugins'
  })
  .option('moduleName', {
    desc: 'Module name for UMD bundle'
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
  .option('inspectRollup', {
    desc: 'Inspect Rollup options'
  })

cli.parse()
