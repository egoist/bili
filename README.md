<p align="center">
  <img src="./media/logo.png" width="60" /><br>
  <br><strong>bubleup</strong> transpiles ESnext code<br> with the power of <a href="https://github.com/rollup/rollup">Rollup</a> and <a href="https://gitlab.com/Rich-Harris/buble">Buble</a>.
</p>

<p align="center">
  <a href="https://npmjs.com/package/bubleup"><img src="https://img.shields.io/npm/v/bubleup.svg?style=flat-square" alt="NPM version"></a>
  <a href="https://npmjs.com/package/bubleup"><img src="https://img.shields.io/npm/dm/bubleup.svg?style=flat-square" alt="NPM downloads"></a>
  <a href="https://circleci.com/gh/egoist/bubleup/tree/master"><img src="https://img.shields.io/circleci/project/egoist/bubleup/master.svg?style=flat-square"></a>
  <a href="https://circleci.com/gh/egoist/bubleup/tree/master"><img src="https://img.shields.io/coveralls/egoist/bubleup/master.svg?style=flat-square"></a>
</p>

## tl;dr

```bash
$ bubleup
# is the same as
$ bubleup src/index.js --out-dir dist
```

<details><summary>Table of Contents</summary>

<!-- toc -->

- [Why is this useful?](#why-is-this-useful)
- [Install](#install)
- [Usage](#usage)
  * [name](#name)
  * [format](#format)
  * [compress](#compress)
  * [alias](#alias)
  * [paths](#paths)
  * [transforms](#transforms)
  * [target](#target)
  * [jsx](#jsx)
  * [map](#map)
- [API](#api)
- [License](#license)

<!-- tocstop -->

</details>

## Why is this useful?

I always repeat configuring the same thing for my front-end libraries which need to support `commonjs` and `umd` at the same time. With Bubleup you can simply run `bubleup --format umd --format cjs` to build for both, and it's fast! You can even pass `--compress` to generate compressed file and sourcemap.

## Install

```bash
$ npm install -g bubleup
```

## Usage

The buble guide: https://buble.surge.sh/guide

You can specific options in command-line:

```bash
$ bubleup src/index.js -d dist --transforms.dangerousForOf
```

For full CLI usage please run `bubleup -h`, It's hard to describe some nested options in command line, so you can also configure them in package.js, eg:

```js
{
  "bubleup": {
    "entry": "./path/to/my-entry.js"
  }
}
```

### name

The filename of bundled files, the default value is package name in `package.json`. If no package.json was found, fallback to `index`.

```bash
$ bubleup --name redux --format umd --format cjs
# generate ./dist/redux.js ./dist/redux.common.js
```

### format

Specific the bundle format, it could be a string like `'umd'` or multiple targets `['umd', 'cjs']`, it's useful if you want to support multiple standards. Default value is `['cjs']`.

You should specfic a `moduleName` if you target `umd`, otherwise fallback to `name`.

```js
{
  "bubleup": {
    "format": ["cjs", "umd"]
  }
}
```

### compress

Enable this option to generate an extra compressed file for the UMD bundle, and sourcemap.

```js
{
  "bubleup": {
    "format": "umd",
    "compress": true
  }
}
// generates: [name].js [name].min.js [name].min.js.map
```

### alias

This is some feature which is similar to Webpack's `alias`, eg:

```js
{
  "bubleup": {
    "alias": {
      "controllers": "./src/controllers"
    }
  }
}
```

### paths

This helps you import some file from the CDN (as using AMD), or set an alias to an external file, see [more details in Rollup's WIKI](https://github.com/rollup/rollup/wiki/JavaScript-API#paths).

### transforms

Apply custom transform rules to `buble` options:

```js
{
  "bubleup": {
    "transforms": {
      "dangerousForOf": true
    }
  }
}

```

### target

Compile targets, eg:

```bash
{
  "bubleup": {
    "target": {"chrome": 48, "firefox": 44, "node": 4}
  }
}
```

### jsx

Buble supports JSX, and you can specfic a custom JSX pragma:

```js
{
  "bubleup": {
    "jsx": "createElement"
  }
}
```

### map

Generate soucemaps:

```js
{
  "bubleup": {
    "map": true
  }
}
```

## API

```js
import bubleup from 'bubleup'

bubleup(options).catch(err => {
  if (err.snippet) {
    // display the actual error snippet
    console.error(err.snippet)
  }
  console.error(err.stack)
})
```

## License

MIT © [EGOIST](https://github.com/egoist)
