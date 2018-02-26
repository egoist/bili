import path from 'path'

const PREFIX = `\0virtual:`

export default function virtual(modules, cwd) {
  const resolvedIds = new Map()

  if (modules) {
    Object.keys(modules).forEach(id => {
      resolvedIds.set(path.resolve(cwd, id), modules[id])
    })
  }

  return {
    name: 'virtual',

    resolveId(id, importer) {
      if (!modules) return

      if (importer) {
        if (importer.startsWith(PREFIX)) {
          importer = importer.slice(PREFIX.length)
        }
        const resolved = path.resolve(path.dirname(importer), id)
        if (resolvedIds.has(resolved)) return PREFIX + resolved
      } else {
        // Entry files
        const resolved = path.resolve(id)
        if (resolvedIds.has(resolved)) return PREFIX + resolved
      }
    },

    load(id) {
      if (id.startsWith(PREFIX)) {
        id = id.slice(PREFIX.length)
        return resolvedIds.get(id)
      }
    }
  }
}
