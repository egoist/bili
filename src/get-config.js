import UseConfig from 'use-config'

export function getBabelConfig({ jsx }) {
  return {
    presets: [[require.resolve('./babel'), { jsx }]]
  }
}

export async function getBiliConfig() {
  const useConfig = new UseConfig({
    name: 'bili',
    files: ['package.json', '{name}.config.js', '.{name}rc']
  })
  const { config } = await useConfig.load()
  return config
}
