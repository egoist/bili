'use strict'
const path = require('path')

module.exports = {
  cwd(filePath) {
    return path.resolve(process.cwd(), filePath)
  }
}
