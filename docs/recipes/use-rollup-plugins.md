# Use Rollup Plugins

You can add any Rollup plugin via `plugins` option or `--plugin` flag.

Via config file:

```js
module.exports = {
  plugins: [
    // Bare string, use `rollup-plugin-vue`
    "vue",
    // Directly require
    require("rollup-plugin-foo")()
  ]
};
```

Or CLI flags:

```bash
bili --plugin vue
# multiple
bili --plugin bar,baz
bili --plugin bar --plugin baz
```

## Pass options

If you pass the plugin as string, you can supply its options via root option with corresponding name, e.g. for `rollup-plugin-vue`:

Via config file:

```js
module.exports = {
  plugins: ["vue"],
  vue: {
    someOption: "value"
  }
};
```

Or CLI flags:

```bash
bili --plugin vue --vue.someOption value
```
