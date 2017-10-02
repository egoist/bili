import path from 'path'
import {EventEmitter} from 'events'
import fs from 'fs-extra'
import rm from 'rimraf'
import chalk from 'chalk'
import switchy from 'switchy'

import bili from '../src/bili'
import {handleRollupError} from '../src/utils'
import getConfig from '../src/get-config'
import getRollupOptions from '../src/get-rollup-options'
import log from '../src/log'

function cwd(filePath) {
  return path.join(__dirname, filePath || '')
}

function Promisify(fn) {
  const args = arguments
  return new Promise(resolve => {
    resolve(fn && fn(...[...args].slice(1)))
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
    return Promisify(bili, {
      format: null
    }).catch(err => {
      expect(err.message).toEqual('Expect "format" to be a string or Array')
    })
  })

  test('should throw error when "compress" is neither string/true nor array', () => {
    return Promisify(bili, {
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
  const pkgConfig = getConfig(cwd('fixtures/bili.config.js'))
  console.log(pkgConfig)
  expect(pkgConfig.name).toBe('EGOIST')
  expect(typeof pkgConfig.pkg).toBe('object')
  expect(JSON.stringify(pkgConfig.pkg)).toBe('{}')
})

describe('get rollup options', () => {
  test('should get correct ouput file name', () => {
    return Promisify(getRollupOptions, {
      filename: 'bili',
      outDir: ''
    }, 'iife').then(({ output }) => {
      expect(output.file).toBe('bili.iife.js')
    })
  })

  test('should load default plugins', () => {
    return Promisify(getRollupOptions, {
      filename: 'bili',
      outDir: ''
    }, 'iife').then(({ plugins }) => {
      expect(plugins.length).toBe(3)
      expect(plugins.some(plugin => plugin.name === 'json')).toBe(true)
      expect(plugins.some(plugin => plugin.name === 'async-to-gen')).toBe(true)
      expect(plugins.some(plugin => plugin.name === 'buble')).toBe(true)
    })
  })

  test('flow plugin', () => {
    return Promisify(getRollupOptions, {
      filename: 'bili',
      flow: true,
      outDir: ''
    }, 'iife').then(({ plugins }) => {
      expect(plugins.some(plugin => plugin.name === 'flow-remove-types')).toBe(true)
    })
  })

  test('should throw error when not found plugin', () => {
    return Promisify(getRollupOptions, {
      filename: 'bili',
      plugins: 'vue',
      outDir: ''
    }, 'iife').catch(error => {
      expect(error.code).toBe('MODULE_NOT_FOUND')
    })
  })

  test('should avoid to load built-in plugin', () => {
    return Promisify(getRollupOptions, {
      filename: 'bili',
      plugins: ['commonjs', require('rollup-plugin-node-resolve')],
      outDir: ''
    }, 'iife').then(({ plugins }) => {
      expect(plugins.some(plugin => plugin.name === 'commonjs')).toBe(true)
      expect(plugins.some(plugin => plugin.name === 'nodeResolve')).toBe(true)
    })
  })

  test('should throw error when not found js target plugin', () => {
    return Promisify(getRollupOptions, {
      filename: 'bili',
      js: 'biliscript',
      outDir: ''
    }, 'iife').catch(error => {
      expect(error.code).toBe('MODULE_NOT_FOUND')
    })
  })

  test('should load "alias" plugin when giving "alias"', () => {
    return Promisify(getRollupOptions, {
      filename: 'bili',
      alias: {
        'egoist': 'EGOIST'
      },
      outDir: ''
    }, 'iife').then(({ plugins }) => {
      expect(plugins.some(plugin => plugin.resolveId)).toBe(true)
    })
  })

  test('should load "replace" plugin when giving "env"', () => {
    return Promisify(getRollupOptions, {
      filename: 'bili',
      env: {
        NODE_ENV: 'development'
      },
      outDir: ''
    }, 'iife').then(({ plugins }) => {
      expect(plugins.some(plugin => plugin.name === 'replace')).toBe(true)
    })
  })

  test('should throw error when getting a non-string name value', () => {
    return Promisify(getRollupOptions, {
      filename: 'bili',
      banner: {
        name: ['egoist']
      },
      outDir: ''
    }, 'iife').catch(error => {
      expect(error.message).toBe('Expect "name" in package.json to be a string but got object.')
    })
  })

  test('should get correct name when giving moduleName', () => {
    return Promisify(getRollupOptions, {
      filename: 'bili',
      moduleName: 'BILI',
      outDir: ''
    }, 'iife').then(({ output }) => {
      expect(output.name).toBe('BILI')
    })
  })

  test('should only load specified plugin when giving a Function-typed plugin', () => {
    return Promisify(getRollupOptions, {
      filename: 'bili',
      plugins: require('rollup-plugin-node-resolve'),
      outDir: ''
    }, 'iife').then(({ plugins }) => {
      expect(Object.prototype.toString.call(plugins)).toBe('[object Object]')
      expect(plugins.name).toBe('node-resolve')
    })
  })

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
