# Node.js API

To use `bili` programmatically:

```js
import bili from 'bili'

bili(options).catch(err => {
  if (err.snippet) {
    // display the actual error snippet
    console.error(err.snippet)
  }
  console.error(err.stack)
})
```
