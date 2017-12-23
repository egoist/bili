# Bili

[![NPM version](https://img.shields.io/npm/v/bili.svg?style=flat)](https://npmjs.com/package/bili) [![NPM downloads](https://img.shields.io/npm/dm/bili.svg?style=flat)](https://npmjs.com/package/bili) [![CircleCI](https://circleci.com/gh/egoist/bili/tree/master.svg?style=shield)](https://circleci.com/gh/egoist/bili/tree/master) [![codecov](https://codecov.io/gh/egoist/bili/branch/master/graph/badge.svg)](https://codecov.io/gh/egoist/bili) [![donate](https://img.shields.io/badge/$-donate-ff69b4.svg?maxAge=2592000&style=flat)](https://github.com/egoist/donate) [![chat](https://img.shields.io/badge/chat-on%20discord-7289DA.svg?style=flat)](https://chat.egoist.moe)

> Delightful library bundler.

## Features

* 🚀 Fast, well it's using Rollup anyways.
* 🚗 Automatically transforms JS files using Buble/Babel.
* 🎶 Ridiculously easy to use Rollup plugins if you want.
* 🚨 Friendly error logging experience.

<img src="https://i.loli.net/2017/12/23/5a3e1771e062f.png" width="400" alt="preview">

## Install

```bash
# Globally
yarn global add bili
# Locally
yarn add bili --dev
```

If you prefer npm:

```bash
# Globally
npm i -g bili
# Locally
npm i -D bili
```

## Usage

Bundle `src/index.js` with a single command:

```bash
bili
```

Then you will get `./dist/index.cjs.js`. To generate in more formats, try:

```bash
bili --format cjs,es,umd,umd-min
```

Then you will get:

```bash
index.js            # UMD format
index.min.js        # Minified UMD format
index.min.js.map    # Sourcemaps for minified UMD format
index.cjs.js        # CommonJS format
index.m.js          # ES module format
```

Dive into the [documentation](https://egoist.moe/bili) to see more neat features!

Here're some quick links:

* [How to use Flow/TypeScript or any compile-to-js language](https://egoist.moe/bili/#/recipes/transpile-js-files)
* [How to transpile CSS files](https://egoist.moe/bili/#/recipes/transpile-css-files)
* [How to transpile Vue files](https://egoist.moe/bili/#/recipes/transpile-vue-files)

## Bundled by Bili

* [cac](https://github.com/egoist/cac) - Simple yet powerful framework for building command-line interface.
* [vue-final-form](https://github.com/egoist/vue-final-form) - 🏁 High performance subscription-based form state management for Vue.js.
* [babel-preset-vue](https://github.com/vuejs/babel-preset-vue) - Babel preset for transforming Vue JSX.
* Feel free to submit yours

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Author

**bili** © [EGOIST](https://github.com/egoist), Released under the [MIT](./LICENSE) License.<br>
Authored and maintained by EGOIST with help from contributors ([list](https://github.com/egoist/bili/contributors)).

> [egoist.moe](https://egoist.moe) · GitHub [@EGOIST](https://github.com/egoist) · Twitter [@\_egoistlily](https://twitter.com/_egoistlily)
