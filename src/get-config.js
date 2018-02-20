import path from 'path'
import UseConfig from 'use-config'
import chalk from 'chalk'
import logger from './logger'

export function getBabelConfig({ jsx }) {
  return {
    presets: [[require.resolve('./babel'), { jsx }]]
  }
}

export function getBiliConfig() {
  const useConfig = new UseConfig({
    name: 'bili',
    files: ['package.json', '{name}.config.js', '.{name}rc', '.{name}rc.js']
  })
  const { path: configPath, config } = useConfig.loadSync()
  if (configPath) {
    logger.debug(chalk.bold(`Bili config file: ${path.relative(process.cwd(), configPath)}`))
  }
  return config
}
