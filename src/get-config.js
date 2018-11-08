import path from 'path'
import UseConfig from 'use-config'
import chalk from 'chalk'
import findBabelConfig from 'find-babel-config'
import logger from './logger'
import BiliError from './bili-error'

export function getBabelConfig(cwd, disableBabelRc, babelOptions) {
  // Only find babelrc one level deep
  const { file } = findBabelConfig.sync(cwd, 1)
  const babelConfig = {
    babelrc: false,
    runtimeHelpers: true
  }

  if (file && !disableBabelRc) {
    logger.debug(`${chalk.bold('Babel config')}:\n${file}`)
    babelConfig.extends = file
  }
  if (!babelConfig.extends) {
    // Use our default preset when no babelrc was found
    babelConfig.presets = [[require.resolve('./babel'), babelOptions]]
  }

  return babelConfig
}

export function getBiliConfig(_config) {
  const useConfig = new UseConfig({
    name: 'bili',
    files: _config ? [_config] : ['package.json', '{name}.config.js', '.{name}rc']
  })
  const { path: configPath, config } = useConfig.loadSync()
  if (configPath) {
    logger.debug(chalk.bold(`Bili config file: ${path.relative(process.cwd(), configPath)}`))
  } else if (_config) {
    throw new BiliError(`Cannot find Bili config file at ${_config}`)
  }
  return config
}

export function getPrettierConfig() {
  const useConfig = new UseConfig({
    name: 'prettier',
    files: ['.{name}rc', '{name}.config.js', '.{name}rc.js', 'package.json']
  })
  const { path: configPath, config } = useConfig.loadSync()
  if (configPath === undefined) {
    throw new BiliError('Cannot find Prettier config file.')
  }
  return config
}
