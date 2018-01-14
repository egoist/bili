# Bili

Delightful library bundler.

## Features

* 🚀 Fast, zero-config by default.
* 📦 Using Rollup under the hood.
* 🚗 Automatically transforms JS files using Buble/Babel.
* 💅 Built-in support for `CSS` `Sass` `Stylus` `Less` `CSS modules`.
* 🎶 Ridiculously easy to use Rollup plugins if you want.
* 🚨 Friendly error logging experience.

## Quick Start

Run a single command to bundle `src/index.js`:

```bash
bili
```

And the output will be:

```
┌───────────────────────────────────┐
│file               size   gzip size│
│dist/index.cjs.js  84 B   98 B     │
└───────────────────────────────────┘
```

It's bundled into CommonJS format by default, to bundle in other format you can use the [`format`](/api#format) option:

```bash
bili --format cjs,umd,umd-min
```

* `dist/index.cjs.js`: CommonJS format, to use in Node.js or with a bundler.
* `dist/index.js`: UMD format, to use in browser directly.
* `dist/index.min.js`: UMD format, to use in browser directly.
* `dist/index.m.js`: ES modules format.

You may use a custom [`moduleName`](/api#modulename) for the UMD format.
