import path from 'path'
import fs from 'fs'
import Bili from '../src'

const filename = 'watch.test.output.js'
const input = path.resolve(__dirname, 'demo/index.js')
const option = {
  input,
  filename,
  outDir: path.resolve(__dirname),
  watch: true
}

test('watch', async () => {
  const result = await Bili.generate(option)
  expect(result).toHaveProperty('bundles')
  expect(result.watchers.length).toBe(1)

  // close and clean
  result.watchers[0].close()
  fs.unlinkSync(path.resolve(__dirname, filename))
})
