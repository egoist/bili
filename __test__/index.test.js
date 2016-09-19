const path = require('path')
const bubleup = require('../lib/bubleup')

test('it throws because entry not found', () => {
  return bubleup().catch(err => {
    expect(err.message).toEqual('Could not resolve entry (./src/index.js)')
  })
})

test('it builds successfully', () => {
  return bubleup({
    entry: path.join(__dirname, './fixtures/entry.js'),
    format: ['umd', 'cjs']
  }).then(() => {
      const foo = require('../dist/index.common.js')
      expect(foo).toEqual(1)
      const bar = require('../dist/index.js')
      expect(bar).toEqual(1)
    })
})

