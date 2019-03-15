# CSS

`Bili` supports CSS by default with the help from [rollup-plugin-postcss](https://github.com/egoist/rollup-plugin-postcss):

By default CSS files will be extracted to the same location where the JS is generated but with `.css` extension.

You can inline CSS in your bundle by either using CLI option: `--no-extract-css` or config file:

```js
module.exports = {
  output: {
    extractCSS: false
  }
}
```

## PostCSS Config

You can populate a `postcss.config.js` to use custom PostCSS plugins.

## CSS Preprocessors

`rollup-plugin-postcss` also supports common CSS Preprocessors like Sass:

```bash
yarn add node-sass --dev
```

Then you can import `.scss` or `.sass` files in your code.

For Stylus and Less, you also need to install `stylus` and `less` in your project.
