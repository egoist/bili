import slash from 'slash'
import { NormalizedConfig } from '../'

export default function(externals: NormalizedConfig['externals'], id: string) {
  id = slash(id)

  if (!Array.isArray(externals)) {
    externals = [externals] as NormalizedConfig['externals']
  }

  for (const external of externals) {
    if (
      typeof external === 'string' &&
      (id === external || id.includes(`/node_modules/${external}/`))
    ) {
      return true
    }
    if (external instanceof RegExp) {
      if (external.test(id)) {
        return true
      }
    }
    if (typeof external === 'function') {
      if (external(id)) {
        return true
      }
    }
  }

  return false
}
