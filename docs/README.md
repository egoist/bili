# Bili

Delightful library bundler.

## Features

- 🚀 Fast, zero-config by default.
- 📦 Using Rollup under the hood.
- 🚗 Automatically transforms JS files using Buble, Babel or TypeScript.
- 🧩 Bundles TypeScript declarations into a single `.d.ts` file.
- 💅 Built-in support for CSS, Sass, Stylus, Less and CSS modules.
- 🎶 Ridiculously easy to use Rollup plugins if you want.
- 🚨 Friendly error logging experience.
- 💻 Written in TypeScript, automatically generated API docs.

## Quick Start

Bili is available on npm, [install it](./installation.md) first if you haven't.

Run `bili` in your project to bundle `src/index.js` in CommonJS format:

```bash
bili
```

To bundle in other formats:

```bash
bili --format esm
# Or multiple
bili --format cjs --format esm
```

And you want minified bundles?

```bash
bili --format esm-min --format cjs-min
```

Bundle TypeScript declarations too:

```bash
bili src/index.ts --dts
```
