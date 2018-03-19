# Bundle multi files

You can specify multi entries like:

```bash
bili src/index.js src/cli.js --filename "[name].js"
# or use glob patterns
bili "src/*.js" --filename "[name].js"
```

<details style="margin-bottom: 20px;color: #666"><summary style="font-style: italic">A note on why we use `filename` option here</summary><br>

In `cjs` format the filename of output files will be `[name][suffix].js` where the `[suffix]` is `.cjs` in this case, however you may import `src/index.js` in `src/cli.js` in the form of `import main from './index'` without the `.cjs` suffix, so we have to remove suffix here.

</details>

In this way the bundled files will be:

```bash
dist/index.js
dist/cli.js
```

It's common to build a CLI library and expose the API at the same time, so this could be very useful.

## Exclude specific files from bundle

In `cjs` and `es` format, only modules in `node_modules` directory will be excluded from your bundle, this is fine when you are building a single-entry library.

However for a multi-entry lib, like a CLI app which exposes `dist/index.js` for API that you can require and `dist/cli.js` that you can use in terminal, bundling all files in both bundles introduces duplicated code, it's not really a big issue but for the sake of size, let's fix it!

Let's say we have a `./src/cli.js` which imports and uses `./src/index.js`:

```js
// src/cli.js
#!/usr/bin/env node
import main from './index'

console.log(main)
```

```js
// src/index.js
export default 42
```

All you have to do is adding `./src/index.js` to the `external` option:

```bash
bili "src/{cli,index}.js" --external "./src/index.js" --filename "[name].js"
```

The value of `external` should actually be module name or absolute path, but since you're using CLI flag, we make it easier by auto-absolutify path starting with `./`.

Then your `dist/cli.cjs.js` will look similar to:

```js
#!/usr/bin/env node
'use strict'

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex
}

var main = _interopDefault(require('./index'))

console.log(main)
```
