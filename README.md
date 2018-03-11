<p align="center">
<img src="https://i.loli.net/2018/02/02/5a741da489499.png" alt="logo">
</p>

<p align="center"><a href="https://npmjs.com/package/bili"><img src="https://img.shields.io/npm/v/bili.svg?style=flat" alt="NPM version"></a> <a href="https://npmjs.com/package/bili"><img src="https://img.shields.io/npm/dm/bili.svg?style=flat" alt="NPM downloads"></a> <a href="https://circleci.com/gh/egoist/bili/tree/master"><img src="https://circleci.com/gh/egoist/bili/tree/master.svg?style=shield" alt="CircleCI"></a> <a href="https://codecov.io/gh/egoist/bili"><img src="https://codecov.io/gh/egoist/bili/branch/master/graph/badge.svg" alt="codecov"></a> <a href="https://github.com/egoist/donate"><img src="https://img.shields.io/badge/$-donate-ff69b4.svg?maxAge=2592000&amp;style=flat" alt="donate"></a> <a href="https://chat.egoist.moe"><img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg?style=flat" alt="chat"></a></p>

## Features

* 🚀 Fast, zero-config by default.
* 📦 Using Rollup under the hood.
* 🚗 Automatically transforms JS files using Buble/Babel.
* 💅 Built-in support for `CSS` `Sass` `Stylus` `Less` `CSS modules`.
* 🎶 Ridiculously easy to use Rollup plugins if you want.
* 🚨 Friendly error logging experience.

<img src="https://cdn.rawgit.com/egoist/bili/master/media/preview.svg" width="600" alt="preview">

_In `umd` format it inlines node modules (could be turned off) so it takes a bit longer._

## Install

**😇 Migrating from v1 to v2? Check out [release note](https://github.com/egoist/bili/releases/tag/v2.0.0).**<br>
**😇 Migrating from v2 to v3? Check out [release note](https://github.com/egoist/bili/releases/tag/v3.0.0).**

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
index.es.js         # ES module format
```

Dive into the [documentation](https://egoist.moe/bili) to see more neat features!

Here're some quick links:

* [How to use Rollup plugins](https://egoist.moe/bili/#/recipes/use-rollup-plugins)
* [How to use Flow/TypeScript or any compile-to-js language](https://egoist.moe/bili/#/recipes/transpile-js-files)
* [How to transpile CSS files](https://egoist.moe/bili/#/recipes/transpile-css-files)
* [How to transpile Vue files](https://egoist.moe/bili/#/recipes/transpile-vue-files)

## Bundled by Bili

* [cac](https://github.com/egoist/cac) - Simple yet powerful framework for building command-line interface.
* [vue-final-form](https://github.com/egoist/vue-final-form) - 🏁 High performance subscription-based form state management for Vue.js.
* [babel-preset-vue](https://github.com/vuejs/babel-preset-vue) - Babel preset for transforming Vue JSX.
* [uncouple](https://github.com/VitorLuizC/uncouple) - A simple lib to uncouple prototype methods.
* [cullender](https://github.com/VitorLuizC/cullender) - A simple and composable way to filter data.
* [vuex-handler](https://github.com/VitorLuizC/vuex-handler) - A vuex plugin to globally handle actions successes and failures.
* [gulp-html-accents](https://github.com/VitorLuizC/gulp-html-accents) - A gulp plugin that parse accents and special characters to HTMLEntities.
* [vue-data-tablee](https://github.com/VitorLuizC/vue-data-tablee) - A pretty simple Vue DataTable component with some features like sort and select rows.
* [vue-uuid](https://github.com/VitorLuizC/vue-uuid) - Vue plugin to add UUID methods to Vue instance.
* [vue-gh-corners](https://github.com/gluons/vue-gh-corners) - :octocat: GitHub Corners for Vue.
* [alphaX](https://github.com/ulivz/alphax) - :fire: Fueling your scaffolding.
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
