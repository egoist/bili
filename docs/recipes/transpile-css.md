# Transpile CSS

`Bili` supports CSS by default with the help from [rollup-plugin-postcss](https://github.com/egoist/rollup-plugin-postcss):

The default options for `rollup-plugin-postcss`:

```js
{
  extract: true;
}
```

By default CSS files will be extracted to the same location where the JS is generated but with `.css` extension.
