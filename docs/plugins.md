# Plugins

Bili allows you to add addtional Rollup plugins like this:

```js
module.exports = {
  plugins: {
    name: true | false | object
  }
}
```

The name should be the package name of the plugin, without the `rollup-plugin-` prefix.

The value will be used as its options, passing `true` is equivalent to an empty object, `false` is used to disable <a href="/api/globals.html#builtin_plugins">built-in plugins</a>.

To add plugin via CLI flags, you can do this:

```bash
bili --plugin.foo --plugin.bar.option value
```

To disable the built-in Babel plugin:

```bash
bili --no-plugin.babel
```
