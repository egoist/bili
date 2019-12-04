import builtinModules from 'builtin-modules'
import { NormalizedConfig } from '../index'
import isExternal from '../utils/is-external'
import logger from '../logger'

interface Options {
  rootDir: string
  bundleNodeModules?: boolean | string[]
  externals: NormalizedConfig['externals']
  browser: boolean
}

export default (options: Options) => {
  const plugin = require('@rollup/plugin-node-resolve')({
    extensions: ['.js', '.json', '.jsx', '.ts', '.tsx'],
    preferBuiltins: true,
    mainFields: [
      options.browser && 'browser',
      'module',
      'jsnext:main',
      'main'
    ].filter(Boolean)
  })

  return {
    ...plugin,

    name: 'bili-custom-resolve',

    async resolveId(importee: string, importer?: string) {
      // Exclude built-in modules
      if (builtinModules.includes(importee)) {
        return false
      }
      const id = await plugin.resolveId(
        importee,
        importer || `${options.rootDir}/__no_importer__.js`
      )
      if (id && typeof id === 'string') {
        // If we don't intend to bundle node_modules
        // Mark it as external
        if (/node_modules/.test(id)) {
          if (!options.bundleNodeModules) {
            return false
          }
          if (Array.isArray(options.bundleNodeModules)) {
            const shouldBundle = options.bundleNodeModules.some(name =>
              id.includes(`/node_modules/${name}/`)
            )
            if (!shouldBundle) {
              return false
            }
          }
        }

        if (isExternal(options.externals, id, importer)) {
          return false
        }

        if (/node_modules/.test(id) && !/^\.?\//.test(importee)) {
          logger.debug(`Bundled ${importee} because ${importer} imported it.`)
        }
      }

      return id
    }
  }
}
