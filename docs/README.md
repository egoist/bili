# bili

Bundling JavaScript library could be easy and interesting.

## Introduction

With one line of code, you'll have `commonjs` `umd` and `compressed` version of your library:

```bash
bili --format cjs --format umd --compress
```

<p class="tip">
  <strong>Why do I need commonjs if I have umd bundle already?</strong><br>
  Good question, because it's common to load umd format library in browser directly, so you have to bundle 3rd-party library within your code, but commonjs code is more widely used with a module system, instead of browser.
</p>

## Installation

```bash
yarn add bili --dev
```

Then you can use it via `yarn bili` in your project or configure it in your npm scripts.

For some CLI usages please run `yarn bili -- -h` to check out.

CLI options can be kept at `./bili.config.js` too.

## How does it work?

`bili` uses [rollup](https://github.com/rollup/rollup) under the hood, by default it accepts an input file `./src/index.js` and then bundle and write to a dist file.

If multiple formats are detected it just runs multiple rollup instances.

## Compile down to ES5

`bili` uses buble to compile your ES2015 code with some default buble options:

```js
const bubleOptions = {
  transforms: {
    generator: false,
    dangerousForOf: false
  }
}
```

buble does not support compiling generator to ES5, for `dangerousForOf` please checkout buble's [guide](https://buble.surge.sh/guide/#dangerous-transforms).

You can override this option by updating config file:

```js
// bili.config.js
module.exports = {
  buble: {
    // ..your options
  }
}
```

You can probably tell that `bili` supports other js compilers like `babel` and `typescript` since it's using rollup, to use one of them please do:

```js
// bili.config.js
module.exports = {
  // and this will load rollup-plugin-typescript
  // in current working directory
  js: 'typescript',
  // similar to buble, optionally set typescript's options
  typescript: {}
}
```

### Named Exports

Default to `auto`, but you can set it to `default` `named` or `none`.

```js
module.exports = {
  exports: 'named'
}
```

For details please checkout https://github.com/rollup/rollup/wiki/JavaScript-API#exports

### Format

Only two formats are supported:

```js
module.exports = {
  format: ['cjs', 'umd']
}
```

The default format is `cjs`.

#### moduleName

When you add a `umd` format, the `moduleName` would be required too, since we need to expose your library:

```js
module.exports = {
  moduleName: 'React'
}
```

#### compress

Use `compress` option to generate compressed file and its sourcemaps.

```js
module.exports = {
  compress: true
}
```
