# Node.js API

To use `bili` programmatically:

```js
import bili from 'bili'

bili(options).catch(err => {
  if (err.snippet) {
    // display the actual error snippet
    console.error(err.snippet)
  }
  console.error(err.stack)
})
```

### name

Type: `string`

The filename of bundled files, the default value is package name in `package.json`. If no package.json was found, fallback to `index`.

### format

Type: `string` or `array`<br>
Default: `['cjs']`

Specific the bundle format, it could be a string like `'umd'` or multiple targets `['umd', 'cjs']`, it's useful if you want to support multiple standards. Default value is `['cjs']`.

You should specfic a `moduleName` if you target `umd`, otherwise fallback to `name`.

### outDir

Type: `string`<br>
Default: `dist`

Output directory.

### compress

Type: `boolean`<br>
Default: `false`

Enable this option to generate an extra compressed file for the UMD bundle, and sourcemap.

### alias

Type: `object`

This is some feature which is similar to Webpack's `resolve.alias`.

### js

Type: `string` `boolean`<br>
Default: `buble`

Load a custom plugin to transpile javascript, eg: `js: 'typescript'` then we load `rollup-plugin-typescript`, and you can configure it via `options.typescript`.

To disable default Buble transformation, you can set it to `false`.

### resolve

Type: `boolean`<br>
Default: `undefined`

Resolve external dependencies, it's always `true` in `umd` format.

### commonjs

Type: `object`<br>
Default: `{ include: 'node_modules/**' }`

Options for [rollup-plugin-commonjs](https://github.com/rollup/rollup-plugin-commonjs), this plugin is only available in `umd` format or option `resolve` is `true`. Since it's used to resolve CommonJS dependencies in node_modules.

### replace

Type: `object`

Add options to [rollup-plugin-replace](https://github.com/rollup/rollup-plugin-replace).

### external

Type: `Array` `Function`

[Exclude files or modules.](https://github.com/rollup/rollup/wiki/JavaScript-API#external)

### paths

Type: `object`

This helps you import some file from the CDN (as using AMD), or set an alias to an external file, see [more details in Rollup's WIKI](https://github.com/rollup/rollup/wiki/JavaScript-API#paths).

### map

Type: `boolean`<br>
Default: `false`

Generate soucemaps for `cjs` and `umd` builds, note that when option `compress` is set to `true` it will always generate sourcemaps for compressed file:

### flow

Type: `boolean`<br>
Default: `undefined`

Remove flow type annotations.

### exports

Type: `string`<br>
Default: `auto`

[Specific what export mode to use](https://github.com/rollup/rollup/wiki/JavaScript-API#exports).

### browser

Type: `boolean`<br>
Default: `false`

Respect `browser` field in `package.json`

### esModules

Type: `boolean`<br>
Default: `true`

Respect `jsnext:main` and `module` field in `package.json`

### plugins

Type: `Array<string>` `Array<plugin>`

Add custom Rollup plugins, for example, to support `.vue` files:

```js
module.exports = {
  plugins: [
    require('rollup-plugin-vue')()
  ]
}
```

Or use string:

```js
module.exports = {
  plugins: ['vue'],
  vue: {} // options for `rollup-plugin-vue`
}
```

Using `string` is handy since you can directly do `bili --plugins vue --vue.css style.css` in CLI without a config file.

### watch

Type: `boolean`<br>
Default: `false`

Run Rollup in watch mode, which means you will have faster incremental builds.

### buble

Options for `rollup-plugin-buble`.

#### buble.objectAssign

Type: `string`<br>
Default: `Object.assign`

The `Object.assign` that used in object spreading.

#### buble.transforms

Type: `object`<br>
Default:

```js
{
  generator: false,
  dangerousForOf: true
}
```

Apply custom transform rules to `buble` options.

#### buble.jsx

Type: `string`

Buble supports JSX, and you can specific a custom JSX pragma, eg: `h`.


#### buble.async

Type: `boolean`<br>
Default: `true`

Transform `async/await` to generator function, defaults to `true`. This is independently using `async-to-gen`.

#### buble.target

Type: `object`

Set compile targets for buble, eg: `{"chrome": 48, "firefox": 44, "node": 4}`.
