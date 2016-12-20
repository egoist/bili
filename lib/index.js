'use strict';

var meow = require('meow');
var chalk = require('chalk');
var update = require('update-notifier');
var bili = require('./bili');

var cli = meow('\n  Usage:\n    bili [entry] [options]\n\n  Examples:\n    bili -d lib --replace.VERSION "0.0.1"\n    bili --format umd --format umd --compress\n\n  Options:\n    --config, -c         Path to config file\n    --watch, -w         Enable file watcher for incremental builds\n    --name, -n          Filename of bundled file, no extenstion and format suffix\n    --out-dir, -d       The directory to dest files\n    --format            Bundle format, cjs/umd\n    --module-name       UMD module name, required in `--format` umd\n    --map               Source map value, can be a boolean or `inline`\n    --compress          Generate an extra compressed file suffixed with `.min` and sourcemap\n    --skip              Exclude specfic modules in node_modules dir from bundled file\n    --jsnext            Respect jsnext field in package.json as resolving node_modules\n    --alias             Add alias option\n    --replace           Add replace option\n    --flow              Remove flow type annotations\n    --exports           Specific what export mode to use\n    --version, -v       Output version\n    --help, -h          Output help (You are here!)\n\n  For more complex configuration please head to https://github.com/egoist/bili#usage\n', {
  alias: {
    h: 'help',
    v: 'version',
    d: 'out-dir',
    n: 'name',
    w: 'watch',
    c: 'config'
  }
});

update({ pkg: cli.pkg }).notify();

var options = Object.assign({
  entry: cli.input[0]
}, cli.flags);

bili(options).catch(function (err) {
  if (err.snippet) {
    console.error(chalk.red('---\n' + err.snippet + '\n---'));
  }
  console.error(err.stack);
  process.exit(1); // eslint-disable-line xo/no-process-exit
});