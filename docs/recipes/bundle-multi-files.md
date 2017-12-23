# Bundle multi files

You can specify multi entries like:

```bash
bili src/index.js src/cli.js
# or use glob patterns
bili "src/*.js"
```

In this way the bundled files will be:

```bash
dist/index.cjs.js
dist/cli.cjs.js
```

It's common to build a CLI library and expose the API at the same time, so this could be very useful.
