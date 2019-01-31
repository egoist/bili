import nodeResolve from 'resolve'
import pify from 'pify'

interface Options {
  cwd: string
}

const resolve = pify(nodeResolve)

const cache = new Map()

export default async function(id: string, options: Options) {
  const cacheId = `${id}::${options.cwd}`

  if (cache.has(cacheId)) return cache.get(cacheId)

  const res = await resolve(id, {
    basedir: options.cwd,
    extensions: ['.js', '.json', '.jsx', '.ts', '.tsx'],
    packageFilter(pkg: any) {
      if (pkg.module) {
        pkg.main = pkg.module
      }
      return pkg
    }
  })

  cache.set(cacheId, res)

  return res
}
