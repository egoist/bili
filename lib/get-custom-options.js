'use strict'
const fs = require('fs')
const pathExists = require('path-exists')
const _ = require('./utils')

function readInPkg(file) {
  try {
    const pkg = require(file)
    const bili = pkg.bili || {}
    if (pkg.name) bili.name = pkg.name
    return bili
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND')
      return {}
    else
      throw err
  }
}

// read => bili.config.js & package.json
module.exports = function (options) {
  const config = _.cwd(options.config || 'bili.config.js')
  const pkgConfig = readInPkg(_.cwd('package.json'))
  return pathExists(config)
    .then(exists => {
      if (exists) {
        return Object.assign(require(config), pkgConfig)
      }
      return pkgConfig
    })
}
