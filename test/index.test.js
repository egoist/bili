import path from 'path'
import fs from 'fs-extra'
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
  const { cjs } = await bili({
    entry: cwd('fixtures/entry.js'),
    exports: 'named',
    replace: {
      __VERSION__: '0.0.0'
    },
    write: false
  })
  expect(cjs.code).toMatchSnapshot()
})

describe('scoped', () => {
  beforeAll(() => {
    process.chdir(path.join(__dirname, 'fixtures', 'scoped'))
  })

  test('it should remove the name prefix from a scoped package name', async () => {
    await bili({
      entry: cwd('fixtures/entry.js'),
      exports: 'named',
      outDir: 'dist-scoped'
    })

    const files = await fs.readdir('./dist-scoped')
    expect(files).toEqual(['package-name.common.js'])
  })

  afterAll(() => {
    process.chdir(__dirname)
  })
})

test('use typescript', async () => {
  const { cjs } = await bili({
    entry: cwd('fixtures/index.ts'),
    js: 'typescript',
    write: false
  })
  expect(cjs.code).toMatchSnapshot()
})

test('ignore js plugin', async () => {
  const { cjs } = await bili({
    entry: cwd('fixtures/remain.js'),
    js: false,
    write: false
  })
  expect(cjs.code).toMatchSnapshot()
})

test('custom buble options', async () => {
  const { cjs } = await bili({
    entry: cwd('fixtures/buble-options.js'),
    buble: {
      objectAssign: 'sign'
    },
    write: false
  })

  expect(cjs.code).toMatchSnapshot()
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
  const { cjs } = await bili({
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
  const { umd, umdCompress } = await bili({
    entry: cwd('fixtures/entry.js'),
    format: 'umd',
    compress: true,
    exports: 'named',
    write: false,
    banner: '/*! bilibili */'
  })
  expect(umd.code).toMatchSnapshot()
  expect(umdCompress.code).toMatchSnapshot()
})

test('generate all bundles', async () => {
  const result = await bili({
    entry: cwd('fixtures/entry.js'),
    format: 'all',
    exports: 'named',
    write: false
  })
  expect(Object.keys(result)).toHaveLength(3)
})

describe('compress', () => {
  it('true', async () => {
    const { umd, cjs, umdCompress, cjsCompress } = await bili({
      entry: cwd('fixtures/compress.js'),
      format: 'umd,cjs',
      compress: true,
      write: false
    })
    expect(umd.code).toMatchSnapshot()
    expect(cjs.code).toMatchSnapshot()
    expect(umdCompress.code).toMatchSnapshot()
    expect(cjsCompress.code).toMatchSnapshot()
  })

  it('string', async () => {
    const { umd, cjs, cjsCompress } = await bili({
      entry: cwd('fixtures/compress.js'),
      format: 'umd,cjs',
      compress: 'cjs',
      write: false
    })
    expect(umd.code).toMatchSnapshot()
    expect(cjs.code).toMatchSnapshot()
    expect(cjsCompress.code).toMatchSnapshot()
  })
})

describe('filename', () => {
  beforeAll(() => {
    process.chdir(path.join(__dirname, 'fixtures', 'filename'))
  })

  test('it should honor bili.filename', async () => {
    await bili({
      entry: cwd('fixtures/entry.js'),
      exports: 'named',
      outDir: 'dist-scoped'
    })

    const files = await fs.readdir('./dist-scoped')
    expect(files).toEqual(['package-name-ex.common.js'])
  })

  afterAll(() => {
    process.chdir(__dirname)
  })
})