#!/usr/bin/env node
'use strict'
const path = require('path')
const meow = require('meow')
const update = require('update-notifier')
const merge = require('lodash.merge')
const main = require('./')

const cli = meow(`
  Usage:
    bubleup [entry] [options]

  Options:
    --name, -n          Filename of bundled file, no extenstion and format suffix
    --out-dir, -d       The directory to dest files
    --format            Bundle format, cjs/umd
    --module-name       UMD module name, required in \`--format\` umd
    --map               Source map value, can be a boolean or \`inline\`
    --compress          Generate an extra compressed file suffixed with \`.min\` and sourcemap
    --skip              Exclude specfic modules in node_modules dir from bundled file
    --jsnext            Respect jsnext field in package.json as resolving node_modules
    --version, -v       Output version
    --help, -h          Output help (You are here!)

  For more complex configuration please head to https://github.com/egoist/bubleup#usage
`, {
  alias: {
    h: 'help',
    v: 'version',
    d: 'out-dir',
    n: 'name'
  }
})

update({pkg: cli.pkg}).notify()

let pkg = {}
try {
  pkg = require(path.join(process.cwd(), 'package.json'))
} catch (_) {}

const config = (pkg && pkg.bubleup) || {}

const options = merge({
  entry: cli.input[0],
  name: pkg.name,
}, config, cli.flags)

main(options).catch(e => {
  console.log(e.stack)
  process.exit(1)
})
