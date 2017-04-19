<h1 align="center">bili</h1>

<p align="center">
  <a href="https://npmjs.com/package/bili"><img src="https://img.shields.io/npm/v/bili.svg?style=flat" alt="NPM version"></a>
<a href="https://npmjs.com/package/bili"><img src="https://img.shields.io/npm/dm/bili.svg?style=flat" alt="NPM downloads"></a>
<a href="https://circleci.com/gh/egoist/bili/tree/master"><img src="https://img.shields.io/circleci/project/egoist/bili/master.svg?style=flat"></a>
<a href="https://codecov.io/gh/egoist/bili"><img src="https://img.shields.io/codecov/c/github/egoist/bili.svg?style=flat"></a>
</p>

## Introduction

Running command `bili` it will compile `src/index.js` to:

```bash
dist/[name].common.js # commonjs format
```

The `[name]` is `name` in `package.json` or `index` as fallback.

You can also generate UMD bundle and compress it with: `bili --format umd --compress`, then you get:

```bash
dist/[name].js          # umd format
dist/[name].min.js      # umd format and compressed
dist/[name].min.js.map  # sourcemap
```

Not enough? You can have them all in one command `bili --format cjs --format es --format umd --compress`:

```bash
dist/[name].js          # umd format
dist/[name].min.js      # umd format and compressed
dist/[name].min.js.map  # sourcemap
dist/[name].common.js   # commonjs format
dist/[name].es.js       # es-modules format
```

**Note:** In `UMD` format all third-party libraries will be bundled in dist files, while in other formats they are excluded.

## Install

```bash
npm install -g bili
```

[Dive into the documentation](https://egoistian.com/bili/) if you are ready to bundle!

## FAQ

### Why not use Rollup's `targets` option?

As per Rollup [wiki](https://github.com/rollup/rollup/wiki/Command-Line-Interface#targets):

```js
import buble from 'rollup-plugin-buble'

export default {
  entry: 'src/main.js',
  plugins: [ buble() ],
  targets: [
    { dest: 'dist/bundle.cjs.js', format: 'cjs' },
    { dest: 'dist/bundle.umd.js', format: 'umd' },
    { dest: 'dist/bundle.es.js', format: 'es' },
  ]
}
```

You can use an array as `targets` to generate bundles in multiple formats, which is really neat and helpful.

However, you can't apply different plugins to different target, which means you still need more config files. For example, add `rollup-plugin-node-resolve` and `rollup-plugin-commonjs` in `umd` build, and what about minification? It's yet another config file.

While in bili, it's as simple as running:

```bash
bili src/main.js --format cjs --format umd --format es --compress
```

Everything can be done via CLI options, if it's too long to read, you can keep them in `bili` field in `package.json`:

```js
{
  "bili": {
    "entry": "src/main.js",
    "format": ["cjs", "umd", "es"],
    "compress": true // note: it only compresses umd bundle and will generate sourcemaps
  }
}
```

## License

MIT © [EGOIST](https://github.com/egoist)
