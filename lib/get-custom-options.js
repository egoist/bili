'use strict'
const read = require('read-fallback')
const _ = require('./utils')

function readInPkg(file) {
  try {
    const pkg = require(file)
    const bubleup = pkg.bubleup || {}
    bubleup.name = pkg.name
    return bubleup
  } catch (err) {
    return {}
  }
}

// read => bubleup.config.js
// otherwise => .bublerc
// otherwise => package.json (pkg.bubleup)
// otherwise => {}
module.exports = function (options) {
  const files = []
  if (options.bubleupConfig !== false) {
    files.push('bubleup.config.js')
  }
  if (options.bubleuprc !== false) {
    files.push('.bubleuprc')
  }
  if (options.readPackage !== false) {
    files.push('package.json')
  }
  if (files.length === 0) {
    return {}
  }
  return read(files.map(name => _.cwd(name)), {
    handler(file) {
      if (file.endsWith('package.json')) {
        return readInPkg(file)
      }
      if (file.endsWith('.bubleuprc')) {
        return read.defaultHandler(file)
          .then(data => {
            return JSON.parse(data.content)
          })
      }
      return require(file)
    }
  })
}
