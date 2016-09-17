<p align="center">
  <img src="./media/logo.png" width="60" /><br>
  <br><strong>bubleup</strong> transpiles ESnext code<br> with the power of <a href="https://github.com/rollup/rollup">Rollup</a> and <a href="https://gitlab.com/Rich-Harris/buble">Buble</a>.
</p>

<p align="center">
  <a href="https://npmjs.com/package/bubleup"><img src="https://img.shields.io/npm/v/bubleup.svg?style=flat-square" alt="NPM version"></a>
  <a href="https://npmjs.com/package/bubleup"><img src="https://img.shields.io/npm/dm/bubleup.svg?style=flat-square" alt="NPM downloads"></a>
  <a href="https://github.com/egoist/bubleup"><img src="https://img.shields.io/maintenance/yes/2016.svg?style=flat-square"></a>
</p>

## tl;dr

```bash
$ bubleup
# is the same as
$ bubleup src/index.js -o index.js
```

## Install

```bash
$ npm install -g bubleup
```

## Usage

The buble guide: https://buble.surge.sh/guide

You can specific options in command-line:

```bash
$ bubleup src/index.js -o index.js --transforms.dangerousForOf
```

For full CLI usage please run `bubleup -h`, It's hard to describe some nested options in command line, so you can also configure them in package.json, eg:

```json
{
  "bubleup": {
    "entry": "./path/to/my-entry.js"
  }
}
```

### format

Specific the bundle format, it could be a string like `'umd'` or multiple targets `['umd', 'cjs']`, it's useful if you want to support multiple standards. Default value is `['cjs']`.

You must specfic a `moduleName` if you target `umd`.

```json
{
  "bubleup": {
    "format": ["cjs", "umd"]
  }
}
```

### alias

This is some feature which is similar to Webpack's `alias`, eg:

```json
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

```json
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

```json
{
  "bubleup": {
    "jsx": "createElement"
  }
}
```

### sourcemaps

Generate soucemaps:

```json
{
  "bubleup": {
    "map": true
  }
}
```

## API

```js
import bubleup from 'bubleup'

bubleup(options).catch(e => console.log(e.stack))
```

## License

MIT © [EGOIST](https://github.com/egoist)
