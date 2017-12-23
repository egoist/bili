import path from 'path'
import test from 'ava'
import Bili from '../src'

function fixture(name) {
  return path.join(__dirname, 'fixtures', name)
}

process.env.BILI_TEST = true

function snapshot({ title, input, ...args }) {
  test(title, async t => {
    const { bundles } = await Bili.generate({
      input: fixture(input),
      ...args
    })
    t.snapshot(Object.keys(bundles).map(filepath => [
      bundles[filepath].relative,
      bundles[filepath].code
    ]))
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
