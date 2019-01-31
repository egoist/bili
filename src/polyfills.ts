// Used by ./index.ts#L488 and rollup-plugin-commonjs
Object.values =
  Object.values ||
  ((obj: { [k: string]: any }) => Object.keys(obj).map(i => obj[i]))
