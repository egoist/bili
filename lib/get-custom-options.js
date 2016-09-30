'use strict'
const read = require('read-fallback')
const _ = require('./utils')

function readInPkg(file) {
  try {
    const pkg = require(file)
    const bili = pkg.bili || {}
    bili.name = pkg.name
    return bili
  } catch (err) {
    return {}
  }
}

// read => bili.config.js
// otherwise => .bublerc
// otherwise => package.json (pkg.bili)
// otherwise => {}
module.exports = function (options) {
  const files = []
  if (options.biliConfig !== false) {
    files.push('bili.config.js')
  }
  if (options.bilirc !== false) {
    files.push('.bilirc')
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
      if (file.endsWith('.bilirc')) {
        return read.defaultHandler(file)
          .then(data => {
            return JSON.parse(data.content)
          })
      }
      return require(file)
    }
  })
}
