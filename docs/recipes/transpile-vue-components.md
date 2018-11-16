# Transpile Vue Components

You can use [rollup-plugin-vue](https://github.com/vuejs/rollup-plugin-vue) to achieve this.

```bash
cd my-project
yarn add rollup-plugin-vue@2 --dev
bili --plugin vue
# or with options
bili --plugin vue --vue.css dist/style.css
```

By default `<style>` tag in Vue SFC will be extracted to the same location where the JS is generated but with `.css` extension.

> Note that you need to use `rollup-plugin-vue@2` for now. PR is highly welcome for adding rollup-plugin-vue@4 support.
