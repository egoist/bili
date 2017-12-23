import path from 'path'
import test from 'ava'
import Bili from '../src'

function fixture(name) {
  return path.join(__dirname, 'fixtures', name)
}

process.env.BILI_TEST = true

test('defaults', async t => {
  const { bundles } = await Bili.generate({
    input: fixture('defaults/index.js')
  })
  t.snapshot(Object.keys(bundles).map(filepath => [
    bundles[filepath].relative,
    bundles[filepath].code
  ]))
})
