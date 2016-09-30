<img src="./media/logo.png" alt="logo"/><br><br>

<a href="https://npmjs.com/package/bili"><img src="https://img.shields.io/npm/v/bili.svg?style=flat-square" alt="NPM version"></a>
<a href="https://npmjs.com/package/bili"><img src="https://img.shields.io/npm/dm/bili.svg?style=flat-square" alt="NPM downloads"></a>
<a href="https://circleci.com/gh/egoist/bili/tree/master"><img src="https://img.shields.io/circleci/project/egoist/bili/master.svg?style=flat-square"></a>
<a href="https://codecov.io/gh/egoist/bili"><img src="https://img.shields.io/codecov/c/github/egoist/bili.svg?style=flat-square"></a>

## tl;dr

```bash
# previously named `bubleup`
$ bili
# is the same as
$ bili src/index.js --out-dir dist

# watch mode
$ bili --watch
```

<details><summary>Table of Contents</summary>

<!-- toc -->

- [Why is this useful?](#why-is-this-useful)
- [Install](#install)
- [Usage](#usage)
  * [name](#name)
  * [format](#format)
  * [compress](#compress)
  * [async](#async)
  * [alias](#alias)
  * [jsCompiler](#jscompiler)
  * [replace](#replace)
  * [paths](#paths)
  * [map](#map)
  * [watch](#watch)
  * [buble.transforms](#bubletransforms)
  * [buble.jsx](#bublejsx)
  * [target](#target)
- [API](#api)
- [License](#license)

<!-- tocstop -->

</details>

## Why is this useful?

I always repeat the same configurations for bundling my front-end libraries. With bili you can simply run `bili` to generate `commonjs`-format code and or append `--format umd` to generate `umd`-format code, and it's fast! You can even pass `--compress` to generate compressed file and sourcemap.

## Install

```bash
$ npm install -g bili
```

## Usage

The buble guide: https://buble.surge.sh/guide, this is built upon buble, but you can use any [javascript compiler](#jscompiler) you like.

You can specific options in command-line:

```bash
$ bili src/index.js -d dir
```

For full CLI usage please run `bili -h`, It's hard to describe some nested options in command line, so you can also configure them in `.bilirc`, eg:

```js
{
  "entry": "./path/to/my-entry.js"
}
```

And you can also put the configs in `package.json` under key `bili`. To go even further, if you need the power of javascript, use `bili.config.js`.

### name

The filename of bundled files, the default value is package name in `package.json`. If no package.json was found, fallback to `index`.

```bash
$ bili --name redux --format umd --format cjs
# generate ./dist/redux.js ./dist/redux.common.js
```

### format

Specific the bundle format, it could be a string like `'umd'` or multiple targets `['umd', 'cjs']`, it's useful if you want to support multiple standards. Default value is `['cjs']`.

You should specfic a `moduleName` if you target `umd`, otherwise fallback to `name`.

```js
{
  "format": ["cjs", "umd"]
}
```

### compress

Enable this option to generate an extra compressed file for the UMD bundle, and sourcemap.

```js
{
  "format": "umd",
  "compress": true
}
// generates: [name].js [name].min.js [name].min.js.map
```

### async

Transform `async/await` to generator function, defaults to `true`. This is using `async-to-gen`, so it has nothing to do with `buble`.

### alias

This is some feature which is similar to Webpack's `alias`, eg:

```js
{
  "alias": {
    "controllers": "./src/controllers"
  }
}
```

### jsCompiler

Use a custom js compiler instead of `buble`, it should a rollup plugin, like `rollup-plugin-babel`:

```js
// bili.config.js
const babel = require('rollup-plugin-babel')

module.exports = {
  jsCompiler: babel({
    presets: [
      ['es2015', {modules: false}]
    ]
  })
}
```

### replace

Add options to [rollup-plugin-replace](https://github.com/rollup/rollup-plugin-replace):

```js
{
  "replace": {
    "VERSION": "0.0.1"
  }
}
```

### paths

This helps you import some file from the CDN (as using AMD), or set an alias to an external file, see [more details in Rollup's WIKI](https://github.com/rollup/rollup/wiki/JavaScript-API#paths).

### map

Generate soucemaps for `cjs` and `umd` builds, note that `--compress` will always generate sourcemaps for `.min.js` file:

```js
{
  "map": true
}
```

### watch

Run Rollup in watch mode, which means you will have faster incremental builds.

### buble.transforms

Apply custom transform rules to `buble` options:

```js
{
  "buble": {
    "transforms": {
      "dangerousForOf": false
    }
  }
}

```

### buble.jsx

Buble supports JSX, and you can specfic a custom JSX pragma:

```js
{
  "buble": {
    "jsx": "createElement"
  }
}
```

### target

Compile targets for buble, eg:

```bash
{
  "buble": {
    "target": {"chrome": 48, "firefox": 44, "node": 4}
  }
}
```

## API

```js
import bili from 'bili'

bili(options).catch(err => {
  if (err.snippet) {
    // display the actual error snippet
    console.error(err.snippet)
  }
  console.error(err.stack)
})
```

## License

MIT © [EGOIST](https://github.com/egoist)
