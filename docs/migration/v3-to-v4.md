# Migrate from v3 to v4

Please check out the <a href="/api/interfaces/config.html">Configure References</a> for all options in v4.

## Notable Changes

### Rollup v1

Rollup has been updated to v1, this is a breaking change, so check your bundled file first before publishing it.

### Input Files

In v3 you can use glob patterns as input files like `bili src/*.js --format cjs` but in v4 you can __NOT__ do that, the input must be actual file path. 

Besides using a string or array as input files, now an object is also accepted:

```js
// bili.config.js
module.exports = {
  input: {
    index: 'src/index.js',
    cli: 'src/cli.js'
  }
}
```

### Plugin Usage

Previously you can add additional Rollup plugins by passing an array via `plugins` option, but now it should be:

```js
module.exports = {
  plugins: {
    // The `rollup-plugin-` prefix is not needed in plugin name
    name: true | false | object
  }
}
```

The `--js` flag is removed, now you can use `plugins` option to disable built-in plugins too:

```js
module.exports = {
  plugins: {
    babel: false
  }
}
```

### Buble

Buble is enabled by `--minimal` flag or <a href="/api/interfaces/babelpresetoptions.html#minimal">babel.minimal</a> option.

### TypeScript

Nothing really changed, we automatically use `rollup-plugin-typescript2` if the input file has `.ts` extension.

If you want to transpile TypeScript with Babel, here's a good news, you can just disable this plugin and let our default Babel preset handle `.ts` files using `babel-preset-typescript`.

### JSX

Vue JSX support is removed, it seems to be rarely used. Let me know if you need it.

### Config Files

Config files now get native TypeScript support. See more [here](../configuration-file.md).
