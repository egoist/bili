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
  rm.sync(cwd('dist*'))
  process.chdir(prevCwd)
})

test('it throws because entry not found', () => {
  return bili().catch(err => {
    expect(err.message).toEqual('Could not resolve entry (./src/index.js)')
  })
})

test('it replaces string using rollup-plugin-replace', async () => {
  const [result] = await bili({
    entry: cwd('fixtures/entry.js'),
    exports: 'named',
    replace: {
      __VERSION__: '0.0.0'
    },
    write: false
  })
  expect(result.code).toMatchSnapshot()
})

test('use typescript', async () => {
  const [result] = await bili({
    entry: cwd('fixtures/index.ts'),
    js: 'typescript',
    write: false
  })
  expect(result.code).toMatchSnapshot()
})

test('ignore js plugin', async () => {
  const [result] = await bili({
    entry: cwd('fixtures/remain.js'),
    js: false,
    write: false
  })
  expect(result.code).toMatchSnapshot()
})

test('custom buble options', async () => {
  const [result] = await bili({
    entry: cwd('fixtures/buble-options.js'),
    buble: {
      objectAssign: 'sign'
    },
    write: false
  })

  expect(result.code).toMatchSnapshot()
})

test('it inserts banner', async () => {
  // Skip this for now
  // Maybe add `baseDir` option to allow bili to load package.json from a custom dir
  // banner: Boolean
  // const [es] = await bili({
  //   entry: cwd('fixtures/entry.js'),
  //   format: 'es',
  //   exports: 'named',
  //   banner: true // banner info from package.json
  // })
  // expect(es.code).toMatchSnapshot()

  // banner: Object
  const [cjs] = await bili({
    entry: cwd('fixtures/entry.js'),
    format: 'cjs',
    exports: 'named',
    banner: {
      name: 'bili',
      version: '5.2.0',
      author: 'egoist',
      license: 'MIT'
    },
    write: false
  })
  expect(cjs.code).toMatchSnapshot()

  // banner: String
  const [umd] = await bili({
    entry: cwd('fixtures/entry.js'),
    format: 'umd',
    compress: true,
    exports: 'named',
    write: false,
    banner: '/*! bilibili */'
  })
  expect(umd.code).toMatchSnapshot()
})

test('generate all bundles', async () => {
  const result = await bili({
    entry: cwd('fixtures/entry.js'),
    format: 'all',
    exports: 'named',
    write: false
  })
  expect(result.length).toBe(3)
})

describe('compress', () => {
  it('true', async () => {
    const [umd, cjs] = await bili({
      entry: cwd('fixtures/compress.js'),
      format: 'umd,cjs',
      compress: true,
      write: false
    })
    expect(umd.code).toMatchSnapshot()
    expect(cjs.code).toMatchSnapshot()
  })

  it('string', async () => {
    const [umd, cjs] = await bili({
      entry: cwd('fixtures/compress.js'),
      format: 'umd,cjs',
      compress: 'cjs',
      write: false
    })
    expect(umd.code).toMatchSnapshot()
    expect(cjs.code).toMatchSnapshot()
  })
})
