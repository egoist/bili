# Configuration File

In most cases CLI options would work just fine, however you can also use following configuration files:

- `bili.config.js`
- `bili.config.ts`
- `.bilirc.js`
- `.bilirc.ts`

Check out <a href="/api/interfaces/config">Configuration Reference</a> in the API documentation.

## Syntax

Both `.js` and `.ts` config files are transpiled by Babel using [babel-preset-env](https://babeljs.io/docs/en/babel-preset-env) and [babel-preset-typescript](https://babeljs.io/docs/en/babel-preset-typescript), so feel free to use modern JavaScript features.

## TypeScript

Bili exposes the `Config` type you can use to type-check your configuration:

```ts
// bili.config.ts
import { Config } from 'bili'

const config: Config = {
  input: 'src/index.js'
}

export default config
```

It also works in `.js` file:

```js
/** @type {import('bili').Config} */
module.exports = {
  input: 'src/index.js'
}
```
