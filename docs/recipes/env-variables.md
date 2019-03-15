# Environment Variables

You can replace `process.env.{VAR}` in your code with specific value. For example, we have the code as follows:

```js
export const version = process.env.VERSION
```

Then you can run Bili with CLI flag `--env.VERSION 0.0.0` to replace the corresponding variable to:

```js
export const version = '0.0.0'
```

You can also specify `env` in the Bili config file:

```js
// bili.config.js
module.exports = {
  env: {
    VERSION: '0.0.0'
  }
}
```
