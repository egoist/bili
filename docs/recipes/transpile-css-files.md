# Transpile CSS files

You can use [rollup-plugin-postcss](https://github.com/egoist/rollup-plugin-postcss) to achieve this:

```bash
cd my-project
yarn add rollup-plugin-postcss --dev
bili --plugin postcss
```

The default options for `rollup-plugin-postcss`:

```js
{
  extract: true
}
```

By default CSS files will be extracted to the same location where the JS is generated but with `.css` extension.
