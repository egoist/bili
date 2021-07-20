# Vue Component

If one of your input files ends with `.vue`, Bili will automatically use [rollup-plugin-vue](https://rollup-plugin-vue.vuejs.org).

```bash
yarn add rollup-plugin-vue vue-template-compiler vue --dev
yarn add vue-runtime-helpers

bili src/MyComponent.vue
```

Otherwise you need to add `rollup-plugin-vue` manually using the CLI flag `--plugin.vue` or config file:

```js
// bili.config.js
module.exports = {
  plugins: {
    vue: true
    // or with custom options
    // vue: {}
  }
}
```

NOTE: due to [an issue with rollup-plugin-vue](https://github.com/vuejs/rollup-plugin-vue/issues/303), Windows users should use rollup-plugin-vue 5.1.1 or at least [5.1.5](https://github.com/vuejs/rollup-plugin-vue/issues/303#issuecomment-571249003).
