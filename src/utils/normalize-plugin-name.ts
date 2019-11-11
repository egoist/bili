export default function(name: string): string {
  if (/^@[^/]+\//.test(name)) {
    return name.replace(/^@([^/]+)\/(rollup-plugin-)?/, '@$1/rollup-plugin-')
  }

  return name.replace(/^(rollup-plugin-)?/, 'rollup-plugin-')
}
