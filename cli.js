#!/usr/bin/env node
'use strict'
const path = require('path')
const meow = require('meow')
const update = require('update-notifier')
const main = require('./')

const cli = meow(`
  Usage:
    bubleup [entry]

  Options:
    --output, -o        Dest file path
    --format            Bundle format, cjs/umd/iife
    --module-name       UMD module name, required in \`--format\` umd
    --source-map        Source map value, can be a boolean or \`inline\`
    --version, -v       Output version
    --help, -h          Output help (You are here!)

  For more complex configuration please head to https://github.com/egoist/bubleup#usage
`, {
  alias: {
    h: 'help',
    v: 'version',
    d: 'dest',
    o: 'output'
  }
})

update({pkg: cli.pkg}).notify()

let pkg = {}
try {
  pkg = require(path.join(process.cwd(), 'package.json'))
} catch (_) {}

const options = Object.assign({
  entry: cli.input[0]
}, cli.flags, pkg && pkg.bubleup)
main(options).catch(e => console.log(e.stack))
