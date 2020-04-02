# Plugins

Bili allows you to add additional Rollup plugins like this:

```js
module.exports = {
  plugins: {
    name: true | false | object
  }
}
```

If the package name starts with `rollup-plugin-`, the key should without the `rollup-plugin-` prefix. However, if the package name starts with `@rollup/`, use the full package name.

The value will be used as its options, passing `true` is equivalent to an empty object, `false` is used to disable built-in plugins.

To add plugin via CLI flags, you can do this:

```bash
bili --plugin.foo --plugin.bar.option value
```

To disable the built-in Babel plugin:

```bash
bili --no-plugin.babel
```
