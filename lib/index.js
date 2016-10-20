'use strict'
const meow = require('meow')
const chalk = require('chalk')
const update = require('update-notifier')
const bili = require('./bili')

const cli = meow(`
  Usage:
    bili [entry] [options]

  Examples:
    bili -d lib --replace.VERSION "0.0.1"
    bili --format umd --format umd --compress

  Options:
    --watch, -w         Enable file watcher for incremental builds
    --name, -n          Filename of bundled file, no extenstion and format suffix
    --out-dir, -d       The directory to dest files
    --format            Bundle format, cjs/umd
    --module-name       UMD module name, required in \`--format\` umd
    --map               Source map value, can be a boolean or \`inline\`
    --compress          Generate an extra compressed file suffixed with \`.min\` and sourcemap
    --skip              Exclude specfic modules in node_modules dir from bundled file
    --jsnext            Respect jsnext field in package.json as resolving node_modules
    --alias             Add alias option
    --replace           Add replace option
    --exports           Specific what export mode to use
    --version, -v       Output version
    --help, -h          Output help (You are here!)

  For more complex configuration please head to https://github.com/egoist/bili#usage
`, {
  alias: {
    h: 'help',
    v: 'version',
    d: 'out-dir',
    n: 'name',
    w: 'watch'
  }
})

update({pkg: cli.pkg}).notify()

const options = Object.assign({
  entry: cli.input[0]
}, cli.flags)

bili(options).catch(err => {
  if (err.snippet) {
    console.error(chalk.red(`---\n${err.snippet}\n---`))
  }
  console.error(err.stack)
  process.exit(1) // eslint-disable-line xo/no-process-exit
})

