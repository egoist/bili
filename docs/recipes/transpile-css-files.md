# Transpile CSS files

You can use [rollup-plugin-postcss](https://github.com/egoist/rollup-plugin-postcss) to achieve this:

```bash
cd my-project
yarn add rollup-plugin-postcss --dev
bili --plugin postcss
# to extract CSS
bili --plugin postcss --postcss.extract
```
