const fs = require('fs')
const path = require('path')
const rm = require('rimraf')
const bubleup = require('../lib/bubleup')

function cwd(filePath) {
  return path.join(__dirname, '../', filePath || '')
}

function testDir(filePath) {
  return cwd(`__test__/${filePath}`)
}
beforeEach(() => {
  rm.sync(cwd('dist*'))
})

test('it throws because entry not found', () => {
  return bubleup().catch(err => {
    expect(err.message).toEqual('Could not resolve entry (./src/index.js)')
  })
})

test('it builds successfully', () => {
  return bubleup({
    entry: testDir('fixtures/entry.js'),
    format: ['umd', 'cjs']
  }).then(() => {
      const foo = require('../dist/index.common.js')
      expect(foo.default).toEqual(1)
      const bar = require('../dist/index.js')
      expect(bar.default).toEqual(1)
    })
})

test('it replaces string using rollup-plugin-replace', () => {
  return bubleup({
    entry: testDir('fixtures/entry.js'),
    outDir: 'dist2',
    replace: {
      __VERSION__: '0.0.0'
    }
  }).then(() => {
    const foo = require('../dist2/index.common.js')
    expect(foo.version).toBe('0.0.0')
  })
})
