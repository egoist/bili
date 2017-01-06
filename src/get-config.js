import fs from 'fs'
import {cwd} from './utils'

function readInPkg(file) {
  try {
    const pkg = require(file)
    const bili = pkg.bili || {}
    if (pkg.name) bili.name = pkg.name
    return bili
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      return {}
    }
    throw err
  }
}

// read => bili.config.js & package.json
export default function (file) {
  const config = cwd(file || 'bili.config.js')
  const pkgConfig = readInPkg(cwd('package.json'))
  if (fs.existsSync(config)) {
    return Object.assign(require(config), pkgConfig)
  }
  return pkgConfig
}
