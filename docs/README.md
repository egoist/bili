# Bili

Delightful library bundler.

## Features

* JS is transpiled by Buble with `async/await`, React/Vue JSX, Flow type support.
* Support multi entries.
* Zero-config by default but easy to configure when needed.

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

## Serve application

Rollup, the bundler Bili uses under the hood, is designed to bundle JavaScript libraries instead of applications. However in many cases you may need a way to demonstrate your library and see if it works just fine.

Instead of using `webpack` which is completely a different tool, you can stick to Bili which offers a simple `bili serve` command for this purpose.

Let's say you have built a React component which lies at `index.js`:

```js
import React from 'react'

export default () => <h1>My Component</h1>
```

To visually see if it works as expected, you can populate a `demo.js`:

```js
import React from 'react'
import ReactDOM from 'react-dom'
import MyComponent from './'

ReactDOM.render(<MyComponent />, document.getElementById('app'))
```

Finally serve the demo app:

```bash
bili serve demo.js
```

<img src="https://i.loli.net/2018/01/13/5a59a65f75b05.png" alt="preview serve" width="500">

That's it, go visit `http://localhost:2018` and you'll see your demo application alive. 💃

Some caveats:

* This command is for development only.
* No live-reloading support, which means you need to manually refresh the browser.
* It could be slow for simple application, since it's not what Rollup is good at.
