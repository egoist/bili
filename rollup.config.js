import path from 'path'

export default {
  input: path.resolve('src/index.ts'),
  output: {
    format: 'cjs',
    dir: './dist'
  },
  plugins: [
    require('rollup-plugin-json')(),
    require('rollup-plugin-hashbang')(),
    require('rollup-plugin-babel')({
      extensions: ['.js', '.ts'],
      presets: [require.resolve('./lib/babel/preset')]
    }),
    {
      transform(code) {
        return null
      }
    }
  ]
}
