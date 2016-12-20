'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var rollup = require('rollup');
var watch = require('rollup-watch');
var switchy = require('switchy');
var co = require('co');
var chalk = require('chalk');
var fancyLog = require('fancy-log');
var merge = require('lodash.merge');
var getRollupOptions = require('./get-rollup-options');
var getCustomOptions = require('./get-custom-options');

function log(type, msg, color) {
  if (!color) {
    fancyLog(type + ' ' + msg);
    return;
  }
  fancyLog(color(type) + ' ' + msg);
}

module.exports = co.wrap(regeneratorRuntime.mark(function _callee(options) {
  var customOptions, formats;
  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          options = options || {};
          _context.next = 3;
          return getCustomOptions(options);

        case 3:
          customOptions = _context.sent;


          options = merge({
            entry: './src/index.js',
            exports: options.exports || 'default',
            format: ['cjs']
          }, customOptions, options);

          formats = options.format;

          if (!Array.isArray(formats)) {
            formats = [formats];
          }
          if (options.compress) {
            formats.push('umd-compress');
          }

          _context.next = 10;
          return Promise.all(formats.map(function (format) {
            var rollupOptions = getRollupOptions(options, format);
            if (options.watch) {
              var _ret = function () {
                var init = void 0;
                return {
                  v: new Promise(function (resolve) {
                    var watcher = watch(rollup, rollupOptions);
                    watcher.on('event', function (event) {
                      switchy({
                        STARTING: function STARTING() {
                          log(format, 'starting', chalk.white.bgBlue);
                          if (!init) {
                            init = true;
                            return resolve();
                          }
                        },
                        BUILD_START: function BUILD_START() {},
                        BUILD_END: function BUILD_END() {
                          log(format, 'bundled successfully', chalk.black.bgGreen);
                        },
                        ERROR: function ERROR() {
                          var error = event.error;
                          log(format, '', chalk.white.bgRed);
                          if (error.snippet) {
                            console.error(chalk.red('---\n' + error.snippet + '\n---'));
                          }
                          console.error(error.stack);
                        },
                        default: function _default() {
                          console.error('unknown event', event);
                        }
                      })(event.code);
                    });
                  })
                };
              }();

              if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            }
            return rollup.rollup(rollupOptions).then(function (bundle) {
              return bundle.write(rollupOptions);
            });
          }));

        case 10:
          return _context.abrupt('return', _context.sent);

        case 11:
        case 'end':
          return _context.stop();
      }
    }
  }, _callee, this);
}));