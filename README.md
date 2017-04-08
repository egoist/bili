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

## License

MIT © [EGOIST](https://github.com/egoist)
