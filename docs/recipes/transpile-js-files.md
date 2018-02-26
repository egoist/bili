# Transpile JS files

**Bili** supports Babel and Buble out of the box, you don't need to install any extra plugins to make them work, by default we use `babel`, if you prefer using `buble` to generate smaller output then try `--js buble` flag.

That's it!

## Babel

We use a sane default config for Babel, basically it:

* Uses `babel-preset-env`.
* Supports [Flow](https://flow.org).
* Compiles `object-rest-spread` to `Object.assign`.
* Compiles `async/await` to Promise without regenerator using [fast-async](https://github.com/MatAtBread/fast-async).
* Reac/Vue JSX

## Buble

What Buble supports:

* Supports [Flow](https://flow.org).
* Compiles `object-rest-spread` to `Object.assign`.
* Compiles `async/await` to Promise without regenerator using [fast-async](https://github.com/MatAtBread/fast-async).
* React/Vue JSX

## TypeScript

We automatically use [rollup-plugin-typescript2](https://github.com/ezolenko/rollup-plugin-typescript2) when the entry file ending with `.ts` and no custom JS plugin is specified, however you have to install [rollup-plugin-typescript2](https://github.com/ezolenko/rollup-plugin-typescript2) to make it work.

## Custom JS plugin

Use `js` option for `--js` flag to specify desired JS preprocessor, eg: `--js coffee2` for CoffeeScript 2.

---

See [Use Rollup Plugins](/recipes/use-rollup-plugins#pass-options) for how to pass options to plugins.
