import fs from 'fs-extra'
import path from 'path'
import rm from 'rimraf'
import bili from '../src/bili'

function cwd(filePath) {
  return path.join(__dirname, filePath || '')
}

const prevCwd = process.cwd()

beforeAll(() => {
  process.chdir(__dirname)
})

afterAll(() => {
  // rm.sync(cwd('dist*'))
  process.chdir(prevCwd)
})

test('it throws because entry not found', () => {
  return bili().catch(err => {
    expect(err.message).toEqual('Could not resolve entry (./src/index.js)')
  })
})

test('it builds successfully', async () => {
  await bili({
    entry: cwd('fixtures/entry.js'),
    format: ['umd', 'cjs'],
    exports: 'named'
  })
  const foo = require('./dist/index.common.js')
  expect(foo.default).toEqual(1)
  const bar = require('./dist/index.js')
  expect(bar.default).toEqual(1)

  // Transformed by Buble
  const content = await fs.readFile('./dist/index.common.js', 'utf8')
  expect(content).toMatch('var a = 1')
})

test('it replaces string using rollup-plugin-replace', async () => {
  await bili({
    entry: cwd('fixtures/entry.js'),
    outDir: 'dist2',
    exports: 'named',
    replace: {
      __VERSION__: '0.0.0'
    }
  })
  const foo = require('./dist2/index.common.js')
  expect(foo.version).toBe('0.0.0')
})

test('use typescript', async () => {
  await bili({
    entry: cwd('fixtures/index.ts'),
    outDir: 'dist3',
    js: 'typescript',
  })
  const foo = require('./dist3/index.common.js')
  expect(foo()).toBe(123)
})

test('ignore js plugin', async () => {
  await bili({
    entry: cwd('fixtures/remain.js'),
    outDir: 'dist4',
    js: false
  })
  const content = await fs.readFile('./dist4/index.common.js', 'utf8')
  expect(content).toMatch(`const foo = () => 'foo'`)
})
