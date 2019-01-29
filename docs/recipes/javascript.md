# JavaScript

## Babel

We use a sane default preset for Babel, basically it:

- Uses `babel-preset-env`.
- Compiles TypeScript via `babel-preset-typescript`
- Compiles `object-rest-spread` to `Object.assign`.
- Compiles `async/await` to Promise without regenerator using [babel-plugin-transform-async-to-promises](https://github.com/rpetrich/babel-plugin-transform-async-to-promises).
- Compiles JSX.

You can add a `.babelrc` file in your project to use your custom config instead. If you want to disable `.babelrc` in your project, pass `--no-babel.babelrc` flag.

## TypeScript

We automatically use [rollup-plugin-typescript2](https://github.com/ezolenko/rollup-plugin-typescript2) when the entry file ends with `.ts` extension, however you have to install [rollup-plugin-typescript2](https://github.com/ezolenko/rollup-plugin-typescript2) alongside `typescript` to make it work.

```bash
yarn add typescript rollup-plugin-typescript2 --dev
```
