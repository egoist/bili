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
