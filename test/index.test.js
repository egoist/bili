import path from 'path'
import Bili from '../src'

function fixture(name) {
  return path.join(__dirname, 'fixtures', name)
}

process.env.BILI_TEST = true

function snapshot({ title, input, ...args }) {
  input = Array.isArray(input) ? input : [input]
  test(title, async () => {
    const { bundles } = await Bili.generate({
      input: input.map(v => fixture(v)),
      ...args
    })
    expect(Object.keys(bundles).map(filepath => [
      bundles[filepath].relative,
      bundles[filepath].code
    ])).toMatchSnapshot()
  })
}

snapshot({
  title: 'defaults',
  input: 'defaults/index.js'
})

snapshot({
  title: 'buble:async',
  input: 'buble/async.js'
})

snapshot({
  title: 'buble:async-and-object-rest-spread',
  input: 'buble/async-dot-dot-dot.js'
})

snapshot({
  title: 'buble:react-jsx',
  input: 'buble/react-jsx.js'
})

snapshot({
  title: 'buble:vue-jsx',
  input: 'buble/vue-jsx.js',
  jsx: 'vue'
})

snapshot({
  title: 'banner:true',
  input: 'banner/index.js',
  banner: true,
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
  }
})

snapshot({
  title: 'no-js-transform',
  input: 'no-js-transform/index.js',
  js: false
})

snapshot({
  title: 'banner:string',
  input: 'default.js',
  banner: 'woot'
})

snapshot({
  title: 'exclude file',
  input: 'exclude-file/index.js',
  external: ['./test/fixtures/exclude-file/foo.js']
})

snapshot({
  title: 'extendOptions',
  format: 'umd,umd-min,cjs',
  input: ['extend-options/foo.js', 'extend-options/bar.js'],
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

describe('multi formats without suffix error', () => {
  test('it throws', async () => {
    expect.assertions(1)
    try {
      await Bili.generate({
        input: fixture('defaults/index.js'),
        format: ['cjs', 'umd'],
        filename: '[name].js'
      })
    } catch (err) {
      expect(err.message).toMatch(/Multiple files are emitting to the same path/)
    }
  })

  test('it does not throw', async () => {
    await Bili.generate({
      input: fixture('defaults/index.js'),
      format: ['umd-min', 'umd'],
      filename: '[name].js'
    })
  })
})

test('cwd', async () => {
  // This tests two things
  const bili = await Bili.generate({
    // 1. resolve `input` from `cwd`
    input: 'index.js',
    cwd: fixture('defaults')
  })
  // 2. output file is relative to `cwd`
  const outputPath = Object.keys(bili.bundles)[0]
  expect(outputPath).toMatch('/test/fixtures/defaults/dist/index.cjs.js')
})
