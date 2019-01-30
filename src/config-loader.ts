import path from 'path'
import fs from 'fs'
import JoyCon from 'joycon'
import requireFromString from 'require-from-string'

const configLoader = new JoyCon({
  stopDir: path.dirname(process.cwd())
})

configLoader.addLoader({
  test: /\.[jt]s$/,
  loadSync(id) {
    const content = require('@babel/core').transform(
      fs.readFileSync(id, 'utf8'),
      {
        babelrc: false,
        configFile: false,
        filename: id,
        presets: [
          [
            require('@babel/preset-env'),
            {
              targets: {
                node: 'current'
              }
            }
          ],
          id.endsWith('.ts') && require('@babel/preset-typescript')
        ].filter(Boolean)
      }
    )
    const m = requireFromString(content && content.code ? content.code : '', id)
    return m.default || m
  }
})

export default configLoader
