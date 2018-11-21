# Transpile Vue Components

[rollup-plugin-vue](https://github.com/vuejs/rollup-plugin-vue) works out of the box, but you need to install it in your project first:

```bash
cd my-project
yarn add rollup-plugin-vue vue-template-compiler --dev
bili --plugin vue
```

By default `<style>` tag in Vue SFC will be extracted to the same location where the JS is generated but with `.css` extension.

> Note that Bili requires `rollup-plugin-vue >=4`.
