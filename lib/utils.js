'use strict';

var path = require('path');

module.exports = {
  cwd: function cwd(filePath) {
    return path.resolve(process.cwd(), filePath || '');
  }
};