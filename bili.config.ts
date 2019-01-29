import { Config } from 'bili'

const config: Config = {
  input: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
    babel: 'src/babel/preset.ts'
  },
  bundleNodeModules: true,
  externals: [
    'spawn-sync' // from cross-spawn which is from execa which is from term-size which is from boxen
  ],
  babel: {
    asyncToPromises: false
  }
}

export default config
