# API

```js
import Bili from 'bili'

Bili.write(options).then(() => {
  console.log('Done!')
})
```

## Use config file

Following options are accepted both in CLI flags and config file,namely `bili.config.js`, `.bilirc`, `bili` key in `package.json`.

## options

### input

Type: `string` `Array`<br>
Default: `src/index.js`

Glob patterns or file paths.

### outDir

Type: `string`<br>
Default: `dist`

### format

Type: `string` `Array`<br>
Default: `['cjs']`<br>
Possible values: `cjs` `umd` `es` `iife`<br>
Alias: `formats`

You can add `-min` suffix to generate minified version.

### moduleName

Type: `string`

Required in `umd` format, set the module name.

### global

Type: `object`<br>
Alias: `globals`

Object of id: name pairs, used for umd/iife bundles. For example, in a case like this...

```js
import $ from 'jquery'
```

...we want to tell Bili that the jquery module ID equates to the global $ variable:

```bash
bili --global.jquery "$"
```

All module IDs will be automatically added to [`external`](#external)

### filename

Type: `string`<br>
Default: `[name][suffix].js`

The filename of output file.

* `[name]` is the base name of input, e.g. the base name of `src/index.js` is `index`.
* `[suffix]` is the corresponding suffix for current format, like `.cjs` for `cjs` format, `.m` for `es` format, and there's no suffix for `umd` format.

### name

Type: `string`<br>
Default: Base name of input.

Set the `[name]` part of [`filename`](#filename).

### inline

Type: `boolean`<br>
Default: `false` or `true` when [`format`](#format) is `umd` or `iife`

Inline node modules into final bundle.

### cwd

Type: `string`<br>
Default: `process.cwd()`

The base dir to resolve relative paths from.

### external

Type: `Array` `function`

Either a Function that takes an id and returns `true` (external) or `false` (not external), or an Array of module IDs that should remain external to the bundle. The IDs should be either:

* The name of an external dependency
* A resolved ID (like an absolute or relative path to a file)

### banner

Type: `boolean` `string` `object`

When `true` it inserts a copyright message to the top of final bundle like below:

```js
/*!
 * bili v0.0.0
 * (c) 2017-present egoist <0x142857@gmail.com>
 * Released under the MIT License.
 */
```

By default the information in the copyright message is from your `package.json`, but you can use an `object` as `banner` to override it:

```js
{
  version, name, year, author, license
}
```

Of course a `string` is also accepted.

### postcss

Type: `object`<br>
Default: `{extract: true}`

Options for `rollup-plugin-postcss`, it will also automatically load local PostCSS config file.

### js

Type: `string` `boolean`<br>
Default: `babel`

Specify the Rollup plugin we should use to transform `.js` files, you can set it to `false` to disable this.

Built-in js plugin:

* `buble`: using `rollup-plugin-buble` together with `rollup-plugin-babel` for minimal output
* `babel`: using `rollup-plugin-babel` only

### plugin

Type: `string` `Array<string>` `Array<object>`<br>
Alias: `plugins`

Add extra Rollup plugins, e.g. `rollup-plugin-vue`:

```bash
bili --plugin vue
# or more
bili --plugin vue,coffeescript
# with options
bili --plugin vue --vue.css ./style.css
```

You can also directly require Rollup plugin if you are using JS config or JS API:

```js
// bili.config.js
module.exports = {
  plugin: [require('rollup-plugin-foo')(options)]
}
```

### target

Type: `string`<br>
Default: `browser`<br>
Possible values: `node` `node:{TARGET}`

Compile for specific target:

* For `node`
  * we compile JS to `node: 6` syntax with `babel-preset-env`.
  * Never use `browser` field in `package.json`.
* For `browser`
  * we compile JS to `ie: 9` syntax with `babel-preset-env`.
  * Use `browser` field in `package.json`

Note that this option won't work if you're using custom babel config file.

### jsx

Type: `string`<br>
Default: `react`<br>
Possible values: `react` `vue` or any JSX pragma like `h`

Switch JSX syntax, only works with our default Babel config or Buble.

### objectAssign

Type: `string`<br>
Default: `undefined`

Replace `Object.assign` (including the ones transformed from object reset spread) with a custom function name.

This only works with our default Babel config or Buble.

### exports

Type: `string`<br>
Default: `auto`

https://rollupjs.org/#exports. You will need it to disable the warning when you're mixing default export and named exports.

### minifier

Type: `string`<br>
Default: `uglify-es`<br>
Possible values: `uglify-es` `uglify-js`

Choose a minifier.

FYI, `uglify-js` cannot minify ES2015+ code.

### replace

Type: `object`

Add options for [rollup-plugin-replace](Add options to rollup-plugin-replace.).

### alias

Type: `object`

This is some feature which is similar to Webpack's `resolve.alias`.

### env

Type: `object`

Like [`replace`](#replace) option but it replaces strings that start with `process.env` and automatically stringifies the value:

```js
bili --env.NODE_ENV development
```

Then in your app:

```js
const prod = process.env.NODE_ENV === 'production'
// compiled to
const prod = 'development' === 'production'
```

<p class="tip">
Note that in `umd` and `iife` format, `NODE_ENV` will default to `development` when uncompressed or `production` when compressed.
</p>

### virtualModules

Type: `object`

Load modules from memory.

Let's say you have `src/index.js`:

```js
import foo from 'foo'

console.log(foo + 'bar')
```

And config file:

```js
module.exports = {
  input: './src/index.js',
  virtualModules: {
    foo: `export default 'foo'`
  }
}
```

Then the result would be:

```js
console.log('foobar')
```

The entry of `virtualModules` could be a bare module id or absolute path or relative path:

```js
{
  foo: 'export default 1',
  '/path/to/bar': 'export default 2',
  './baz': 'export default 3'
}
```

Note that relative paths are relative to [cwd](#cwd).

### sizeLimit

Type: `object`

Limit bundle gzip size to a threshold and exit with non-zero code when it exceeds the threshold:

```js
{
  "bili": {
    "sizeLimit": {
      "cjs": "3KB"
    }
  }
}
```

You can also set it in CLI flag:

<img src="https://i.loli.net/2018/01/26/5a6a09d130b6d.png" width="450" alt="sizelimit">

Each entry of this option is a [`format`](#format).

### extendOptions

Type: `(currentOptions, ctx) => NewOptions`

Update options.

`ctx` is of type `Ctx`:

```typescript
interface Ctx {
  input: string
  format: string
  compress: boolean
}
```
