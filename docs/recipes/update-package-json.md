# Update `package.json`

Configure fields in `package.json` to make your package work with various enviroments like `npm` `webpack`, or a CDN provider like `jsdelivr`.

## Configure the default file

* `main`: the default file for every enviroment, it's usually pointed to your CommonJS bundle.
* `module`: the default file for tools that supports `es` format.
* `unpkg`: the default file for unpkg.com with fallback to `main` file. You should point it to the `umd` or `iife` bundle.
* `jsdelivr`: like `unpkg` but for jsdelivr.com.

## Specify included files

You should specify which files should be published on npm instead of publishing everything, in this case we're using `bili`, so all files in `dist` folder should be included:

```json
{
  "files": ["dist"]
}
```
