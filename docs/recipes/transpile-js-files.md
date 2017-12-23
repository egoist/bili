# Transpile JS files

**Bili** supports Babel and Buble out of the box, you don't need to install any extra plugins to make them work, by default we use `buble`, if you prefer `babel` then try `--js babel` flag.

Maybe you can already tell, you can use `--js` flag to switch plugin for transpiling JS files. To use a custom JS plugin like `typescript`, try:

```bash
cd my-project
yarn add rollup-plugin-typescript --dev
bili --js typescript
```

That's it!

All Rollup plugins that we use can accept options:

```bash
bili --no-babel.babelrc
# options for rollup-plugin-babel
#=> { babel: { babelrc: false } }

bili --js typescript --typescript.tsconfig ./there/tsconfig.json
# options for rollup-plugin-typescript
#=> { typescript: { tsconfig: './there/tsconfig.json' } }
```

## Babel

We use a sane default config for Babel, basically it:

* Uses `babel-preset-env`.
* Supports [Flow](https://flow.org).
* Compiles `object-rest-spread` to `Object.assign`.
* Compiles `async/await` to Promise without regenerator using [fast-async](https://github.com/MatAtBread/fast-async).

## Buble

What Buble does not support:

* async/await (TODO: use `fast-async` before `buble`)
* Vue JSX (TODO: use `babel` for this)
