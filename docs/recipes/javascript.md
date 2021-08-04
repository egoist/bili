# JavaScript

## Babel

We use a sane default preset for Babel, basically it:

- Uses `babel-preset-env`.
- Compiles TypeScript via `babel-preset-typescript`
- Compiles `object-rest-spread` to `Object.assign`.
- Compiles `async/await` to Promise without regenerator using [babel-plugin-transform-async-to-promises](https://github.com/rpetrich/babel-plugin-transform-async-to-promises).
- Compiles JSX.
- Support [optional chaining](https://babeljs.io/docs/en/babel-plugin-proposal-optional-chaining) out of the box.
- Support [nullish coalescing operator](https://babeljs.io/docs/en/babel-plugin-proposal-nullish-coalescing-operator) out of the box.

You can add a `.babelrc` file in your project to use your custom config instead.
If you want to disable `.babelrc` in your project, pass `--no-babelrc` flag. If
your project uses a `babel.config.js` file, you have to pass `configFile: false`
to the `babel`-plugin via a bili config file:

```js
module.exports = {
  plugins: {
    babel: {
      configFile: false
    }
  }
}
```

You can also use our default preset in your Babel config file:

```js
// babel.config.js
module.exports = {
  presets: ['bili/babel'],
  plugins: [
    // Add your babel plugins...
  ]
}
```

### Browserslist

By default Babel transpiles code to ES5, however you can use [Browserslist](https://github.com/browserslist/browserslist) to specify target environments, e.g. if you only want to support Node.js 10, you can have following config in `package.json`:

```json
{
  "browserslist": ["node 10"]
}
```

### Minimal Mode

`babel-preset-env` will produce A LOT of code if you're targeting ES5, so we provide an option <a href="/api/interfaces/babelpresetoptions.html#minimal">`babel.minimal`</a> to replace this preset with [Buble](https://buble.surge.sh/guide/) instead. You can also use CLI flag `--minimal`.

Notably:

- Buble does not strictly follow spec, use it with caution.
- Browserslist won't work anymore, since it's a feature in babel-preset-env. But you can configure the `buble` plugin using its [target](https://buble.surge.sh/guide/#options) option.

## TypeScript

We automatically use [rollup-plugin-typescript2](https://github.com/ezolenko/rollup-plugin-typescript2) when the entry file ends with `.ts` extension, however you have to install [rollup-plugin-typescript2](https://github.com/ezolenko/rollup-plugin-typescript2) alongside `typescript` to make it work.

```bash
yarn add typescript rollup-plugin-typescript2 --dev
```

## Use Babel with TypeScript

By default Babel is also used for `.ts` files, it will process the file after TypeScript. It's recommended to set `compilerOptions.target` to `es2017` or above in `tsconfig.json` and let Babel transform the code to ES5 instead. If you want to disable Babel, set `plugins: { babel: false }` in your Bili config file.
