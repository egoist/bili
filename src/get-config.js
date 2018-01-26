import path from 'path'
import UseConfig from 'use-config'
import chalk from 'chalk'

export function getBabelConfig({ jsx }) {
  return {
    presets: [[require.resolve('./babel'), { jsx }]]
  }
}

export function getBiliConfig(logger) {
  const useConfig = new UseConfig({
    name: 'bili',
    files: ['package.json', '{name}.config.js', '.{name}rc']
  })
  const { path: configPath, config } = useConfig.loadSync()
  if (configPath) {
    logger.debug(chalk.bold(`Bili config file: ${path.relative(process.cwd(), configPath)}`))
  }
  return config
}
