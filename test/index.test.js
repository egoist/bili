import path from 'path'
import Bili from '../src'

function fixture(name) {
  return path.join(__dirname, 'fixtures', name)
}

process.env.BILI_TEST = true

function snapshot({ title, input, ...args }) {
  test(title, async () => {
    const { bundles } = await Bili.generate({
      input: fixture(input),
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
  input: 'default.js',
  banner: true
})

snapshot({
  title: 'banner:object',
  input: 'default.js',
  banner: {
    year: '2018',
    author: 'author',
    license: 'GPL',
    name: 'name'
  }
})

snapshot({
  title: 'banner:string',
  input: 'default.js',
  banner: 'woot'
})
