import MagicString from 'magic-string'

export default () => {
  let shebang
  const shebangRe = /^\s*(#!.*)/

  return {
    name: 'shebang',

    transform(code) {
      let match

      // eslint-disable-next-line no-cond-assign
      if ((match = shebangRe.exec(code))) {
        shebang = match[1]
        const str = new MagicString(code)
        str.remove(match.index, shebang.length)
        return {
          code: str.toString(),
          map: str.generateMap({ hires: true })
        }
      }

      return null
    },

    transformBundle(code) {
      if (!shebang) return

      const res = {}

      const str = new MagicString(code)
      str.prepend(shebang + '\n')
      res.code = str.toString()
      res.map = str.generateMap({ hires: true })
      return res
    }
  }
}
