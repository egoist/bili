<div align="center">
  <br><strong>bubleup</strong> transpile ESnext code<br> with the power of <a href="https://github.com/rollup/rollup">Rollup</a> and <a href="https://gitlab.com/Rich-Harris/buble">Buble</a>.
</div>

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

For full CLI usage please run `bubleup -h`, It's hard to describe some options in command line, so you can also configure them in package.json, eg:

```json
{
  "bubleup": {
    "entry": "./path/to/my-entry.js"
  }
}
```

### Alias

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

### Paths

This helps you import some file from the CDN (as using AMD), or set an alias to an external file, see [more details in Rollup's WIKI](https://github.com/rollup/rollup/wiki/JavaScript-API#paths).

## API

```js
import bubleup from 'bubleup'

bubleup(options).catch(e => console.log(e.stack))
```

## License

MIT © [EGOIST](https://github.com/egoist)
