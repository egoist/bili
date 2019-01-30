import path from 'path'
import slash from 'slash'
import builtinModules from 'builtin-modules'
import resolve from '../resolve'
import { NormalizedConfig } from '../index'
import isExternal from '../utils/is-external'
import logger from '../logger'

interface Options {
  bundleNodeModules?: boolean | string[]
  rootDir: string
  externals: NormalizedConfig['externals']
}

export default (options: Options) => {
  return {
    name: 'bili-node-resolve',

    resolveId: async (importee: string, importer?: string) => {
      if (/\0/.test(importee)) {
        return null
      }
      const isValidPath = !/[<>:"|?*]/.test(importee)
      if (!isValidPath) {
        return null
      }

      // Exclude built-in modules
      if (builtinModules.includes(importee)) {
        return false
      }

      importee = slash(importee)
      if (importer) {
        importer = slash(importer)
      }

      let id: string

      try {
        id = await resolve(importee, {
          cwd: importer ? path.dirname(importer) : options.rootDir
        })
      } catch (err) {
        if (!importer) {
          // An entry file should not be marked as external if it doesn't exist
          return null
        }
        return false
      }

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

      return id
    },

    transform(code: string, id: string) {
      // if (id.endsWith('.js')) {
      //   return `// module: ${id}\n${code}`
      // }
    }
  }
}
