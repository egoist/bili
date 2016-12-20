'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var path = require('path');
var camelcase = require('camelcase');
var _ = require('./utils');

function getDest(options, format, compress) {
  var name = options.name || 'index';
  var dir = options.outDir || './dist';
  var suffix = '.js';
  if (format === 'cjs') {
    suffix = '.common.js';
  } else if (compress) {
    suffix = '.min.js';
  }
  var output = path.join(dir, name + suffix);
  return output;
}

function getMap(options, compress) {
  return compress ? true : options.map;
}

module.exports = function (options, format) {
  var compress = false;
  if (format === 'umd-compress') {
    format = 'umd';
    compress = true;
  }

  var plugins = [];

  var js = options.js || 'buble';
  var jsPlugin = js === 'buble' ? require('rollup-plugin-buble') : require(_.cwd('rollup-plugin-' + js));
  var jsOptions = options[js] || {};

  // add default options for buble plugin
  if (js === 'buble') {
    var transforms = jsOptions.transforms;
    delete jsOptions.transforms;
    jsOptions = _extends({
      transforms: _extends({
        generator: false,
        dangerousForOf: true
      }, transforms)
    }, jsOptions);
  }

  // for buble
  // optionally compile async/await to generator function
  if (js === 'buble' && jsOptions.async !== false) {
    plugins.push(require('rollup-plugin-async')());
  }

  if (options.flow) {
    plugins.push(require('rollup-plugin-flow')());
  }

  plugins.push(jsPlugin(jsOptions));

  if (options.alias) {
    plugins.push(require('rollup-plugin-alias')(options.alias));
  }

  if (options.replace) {
    plugins.push(require('rollup-plugin-replace')(options.replace));
  }

  if (format === 'umd') {
    plugins.push(require('rollup-plugin-node-resolve')({
      skip: options.skip,
      jsnext: options.jsnext
    }), require('rollup-plugin-commonjs')());
  }

  if (compress) {
    plugins.push(require('rollup-plugin-uglify')());
  }

  var moduleName = 'index';
  if (options.moduleName) {
    moduleName = options.moduleName;
  } else if (options.name) {
    moduleName = camelcase(options.name);
  }

  var external = void 0;
  if (format === 'cjs') {
    // exclude .json files in commonjs bundle
    external = function external(id) {
      return (/\.json$/.test(id)
      );
    };
  }
  external = options.external || external;

  return {
    exports: options.exports,
    entry: options.entry,
    paths: options.paths,
    dest: getDest(options, format, compress),
    sourceMap: getMap(options, compress),
    plugins: plugins,
    format: format,
    moduleName: moduleName,
    external: external
  };
};