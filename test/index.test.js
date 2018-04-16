import path from 'path'
import Bili from '../src'

process.env.BABEL_ENV = 'anything-not-test'

function fixture(...args) {
  return path.join(__dirname, 'fixtures', ...args)
}

function generate(options) {
  return Bili.generate({
    config: false,
    ...options
  })
}

function snapshot({ title, input, ...args }) {
  input = Array.isArray(input) ? input : [input]
  test(title, async () => {
    const { bundles } = await generate({
      input,
      ...args
    })
    expect(Object.keys(bundles)
      .sort()
      .map(filepath => [bundles[filepath].relative, bundles[filepath].code])).toMatchSnapshot()
  })
}

snapshot({
  title: 'defaults',
  input: 'index.js',
  cwd: fixture('defaults')
})

snapshot({
  title: 'buble:async',
  input: 'async.js',
  js: 'buble',
  cwd: fixture('buble')
})

snapshot({
  title: 'buble:async-and-object-rest-spread',
  input: 'async-dot-dot-dot.js',
  js: 'buble',
  cwd: fixture('buble')
})

snapshot({
  title: 'buble:react-jsx',
  input: 'react-jsx.js',
  js: 'buble',
  cwd: fixture('buble')
})

snapshot({
  title: 'buble:vue-jsx',
  input: 'vue-jsx.js',
  jsx: 'vue',
  js: 'buble',
  cwd: fixture('buble')
})

snapshot({
  title: 'banner:true',
  banner: true,
  input: 'index.js',
  cwd: fixture('banner')
})

snapshot({
  title: 'banner:object',
  input: 'default.js',
  banner: {
    year: '2018',
    author: 'author',
    license: 'GPL',
    name: 'name',
    version: '1.2.3'
  },
  cwd: fixture()
})

snapshot({
  title: 'no-js-transform',
  js: false,
  input: 'index.js',
  cwd: fixture('no-js-transform')
})

snapshot({
  title: 'banner:string',
  input: 'default.js',
  banner: 'woot',
  cwd: fixture()
})

snapshot({
  title: 'exclude file',
  input: 'index.js',
  external: ['./foo.js'],
  cwd: fixture('exclude-file')
})

snapshot({
  title: 'extendOptions',
  format: 'umd,umd-min,cjs',
  input: ['foo.js', 'bar.js'],
  cwd: fixture('extend-options'),
  extendOptions(options, { input, format, compress }) {
    if (input.endsWith('foo.js')) {
      options.moduleName = 'endsWithFoo'
    }
    if (format === 'umd') {
      options.moduleName = 'umd'
    }
    if (compress) {
      options.moduleName = 'min'
    }
    return options
  }
})

snapshot({
  title: 'inline:true',
  inline: true,
  input: 'index.js',
  cwd: fixture('inline')
})

snapshot({
  title: 'async',
  input: 'index.js',
  cwd: fixture('async')
})

describe('multi formats without suffix error', () => {
  test('it throws', async () => {
    expect.assertions(1)
    try {
      await generate({
        input: 'index.js',
        format: ['cjs', 'umd'],
        filename: '[name].js',
        cwd: fixture('defaults'),
        moduleName: 'foo'
      })
    } catch (err) {
      expect(err.message).toMatch(/Multiple files are emitting to the same path/)
    }
  })

  test('it does not throw', async () => {
    await generate({
      input: 'index.js',
      format: ['umd-min', 'umd'],
      filename: '[name].js',
      cwd: fixture('defaults'),
      moduleName: 'foo'
    })
  })
})

test('cwd', async () => {
  // This tests two things
  const bili = await generate({
    // 1. resolve `input` from `cwd`
    input: 'index.js',
    cwd: fixture('defaults')
  })
  // 2. output file is relative to `cwd`
  const outputPath = Object.keys(bili.bundles)[0]
  expect(outputPath).toMatch('/test/fixtures/defaults/dist/index.cjs.js')
})

snapshot({
  title: 'virtualModules',
  input: './dayyum',
  cwd: fixture('virtual'),
  virtualModules: {
    './dayyum': `import bar from './bar'\nexport default bar + 123`,
    // Relative path is relative to process.cwd()
    './bar': `import baz from 'baz';export default baz + 1`,
    baz: `export default 2`
  }
})

snapshot({
  title: 'target:node',
  input: 'index.js',
  cwd: fixture('target/node'),
  target: 'node'
})

snapshot({
  title: 'babel:with-config',
  input: 'index.js',
  cwd: fixture('babel/with-config')
})

snapshot({
  title: 'babel:disable-config',
  input: 'index.js',
  cwd: fixture('babel/with-config'),
  babel: {
    babelrc: false
  }
})

snapshot({
  title: 'babel:object-rest-spread',
  input: 'index.js',
  cwd: fixture('babel/object-rest-spread')
})

snapshot({
  title: 'uglify',
  input: 'index.js',
  cwd: fixture('uglify'),
  format: 'cjs-min'
})

snapshot({
  title: 'inline-certain-modules',
  input: 'index.js',
  cwd: fixture('inline-certain-modules'),
  inline: 'fake-module'
})
