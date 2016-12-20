'use strict';

var pathExists = require('path-exists');
var _ = require('./utils');

function readInPkg(file) {
  try {
    var pkg = require(file);
    var bili = pkg.bili || {};
    if (pkg.name) bili.name = pkg.name;
    return bili;
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      return {};
    }
    throw err;
  }
}

// read => bili.config.js & package.json
module.exports = function (options) {
  var config = _.cwd(options.config || 'bili.config.js');
  var pkgConfig = readInPkg(_.cwd('package.json'));
  return pathExists(config).then(function (exists) {
    if (exists) {
      return Object.assign(require(config), pkgConfig);
    }
    return pkgConfig;
  });
};