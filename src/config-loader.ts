import fs from 'fs'
import JoyCon from 'joycon'
import path from 'path'
import requireFromString from 'require-from-string'

import logger from './logger'
import { Config } from './types'

const configLoader = new JoyCon({
  stopDir: path.dirname(process.cwd()),
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
                node: 'current',
              },
            },
          ],
          id.endsWith('.ts') && require('@babel/preset-typescript'),
        ].filter(Boolean),
      }
    )
    const m = requireFromString(content && content.code ? content.code : '', id)
    return m.default || m
  },
})

function loadConfig(
  rootDir: string,
  configFile?: string | boolean
): {
  fileConfig: Config
  configPath?: string
} {
  let configPath: string | undefined

  const fileConfig =
    configFile === false
      ? {}
      : configLoader.loadSync({
          files:
            typeof configFile === 'string'
              ? [configFile]
              : [
                  'bili.config.js',
                  'bili.config.ts',
                  '.bilirc.js',
                  '.bilirc.ts',
                  'package.json',
                ],
          cwd: rootDir,
          packageKey: 'bili',
        })

  if (fileConfig.path) {
    logger.debug(`Using config file:`, fileConfig.path)
    configPath = fileConfig.path
  }

  return {
    fileConfig: fileConfig.data || {},
    configPath,
  }
}

export { loadConfig }
export default configLoader
