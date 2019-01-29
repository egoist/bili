# Update `package.json`

Configure fields in `package.json` to make your package work in various environments like `npm`, `webpack`, or a CDN provider like `jsdelivr`.

## Configure the default file

- `main`: the default file for every environment, it's usually pointed to your CommonJS bundle.
- `module`: the default file for tools that supports ES modules. You should use Bili to generate an ESM bundle whenever possible.
- `unpkg`: the default file for unpkg.com with fallback to `main` file. You should point it to the `umd` or `iife` bundle.
- `jsdelivr`: like `unpkg` but for jsdelivr.com.

## Specify included files

You should specify which files should be published on npm instead of publishing everything, since Bili outputs all files to `dist` directory by here, here it will look like:

```json
{
  "files": ["dist"]
}
```
