export default function(name: string): string {
  // @rollup/alias => @rollup/plugin-alias
  // @foo/baz => @foo/rollup-plugin-baz
  if (/^@[^/]+\//.test(name)) {
    return name.replace(/^@([^/]+)\/(rollup-)?(plugin-)?/, (_, m1) => {
      return m1 === 'rollup' ? `@rollup/plugin-` : `@${m1}/rollup-plugin-`
    })
  }

  return name.replace(/^(rollup-plugin-)?/, 'rollup-plugin-')
}
