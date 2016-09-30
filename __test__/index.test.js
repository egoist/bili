const fs = require('fs')
const path = require('path')
const rm = require('rimraf')
const bili = require('../lib/bili')

process.chdir(__dirname)

function cwd(filePath) {
  return path.join(__dirname, filePath || '')
}

beforeEach(() => {
  rm.sync(cwd('dist*'))
})

test('it throws because entry not found', () => {
  return bili().catch(err => {
    expect(err.message).toEqual('Could not resolve entry (./src/index.js)')
  })
})

test('it builds successfully', () => {
  return bili({
    entry: cwd('fixtures/entry.js'),
    format: ['umd', 'cjs']
  }).then(() => {
      const foo = require('./dist/index.common.js')
      expect(foo.default).toEqual(1)
      const bar = require('./dist/index.js')
      expect(bar.default).toEqual(1)
    })
})

test('it replaces string using rollup-plugin-replace', () => {
  return bili({
    entry: cwd('fixtures/entry.js'),
    outDir: 'dist2',
    replace: {
      __VERSION__: '0.0.0'
    }
  }).then(() => {
    const foo = require('./dist2/index.common.js')
    expect(foo.version).toBe('0.0.0')
  })
})
