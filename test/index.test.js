import path from 'path'
import { EventEmitter } from 'events'
import fs from 'fs-extra'
import rm from 'rimraf'
import chalk from 'chalk'
import switchy from 'switchy'

import bili from '../src/bili'
import { handleRollupError } from '../src/utils'
import getConfig from '../src/get-config'
import getRollupOptions from '../src/get-rollup-options'
import log from '../src/log'

function cwd(filePath) {
  return path.join(__dirname, filePath || '')
}

function safeBox(fn) {
  const args = arguments
  return new Promise(resolve => {
    fn && fn(...[...args].slice(1))
    resolve()
  })
}

const prevCwd = process.cwd()

beforeAll(() => {
  process.chdir(__dirname)
})

afterAll(() => {
  rm.sync(cwd('dist*'))
  process.chdir(prevCwd)
})

afterEach(() => {
  process.exitCode = 0
})

describe('bili', () => {
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

  test('should throw error when "format" is neither string nor array', () => {
    return safeBox(bili, {
      format: null
    }).catch(err => {
      expect(err.message).toEqual('Expect "format" to be a string or Array')
    })
  })

  test('should throw error when "compress" is neither string/true nor array', () => {
    return safeBox(bili, {
      compress: null
    }).catch(err => {
      expect(err.message).toEqual(
        'Expect "compress" to be a string/true or Array'
      )
    })
  })

  test('should work on watch mode', async () => {
    const watchers = await bili({
      entry: cwd('fixtures/entry.js'),
      exports: 'named',
      watch: true
    })
    watchers.forEach(watcher => {
      expect(watcher instanceof EventEmitter).toBeTruthy()
      watcher.on('event', event => {
        switchy({
          ERROR() {
            expect(process.exitCode).toEqual(1)
            process.exitCode = 0
          },
          FATAL() {
            expect(process.exitCode).toEqual(1)
            process.exitCode = 0
          }
        })(event.code)
      })
      watcher.emit('event', { code: 'START' })
      watcher.emit('event', { code: 'BUNDLE_END' })

      watcher.emit('event', { code: 'ERROR', error: 'error' })
      watcher.emit('event', { code: 'FATAL', error: 'error' })
      watcher.emit('event', { code: 'EGOIST' })
      setImmediate(() => {
        watcher.close()
      })
    })
  })
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

describe('log', () => {
  test('should log with color', () => {
    expect(log('info', 'log', chalk.red)).toBeUndefined()
  })

  test('should log without color', () => {
    expect(log('info', 'log')).toBeUndefined()
  })
})

test('should handle rollup error', () => {
  handleRollupError({
    plugin: 'rollup',
    message: 'error',
    id: 1,
    snippet: 'error'
  })
  expect(process.exitCode).toBe(1)
  process.exitCode = 0
})

test('should get correct package config', () => {
  const pkgConfig = getConfig('fixtures/bili.config.js')
  expect(pkgConfig.name).toBe('EGOIST')
  expect(typeof pkgConfig.pkg).toBe('object')
  expect(JSON.stringify(pkgConfig.pkg)).toBe('{}')
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
