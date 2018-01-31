import chalk from 'chalk'
import logger from './logger'

export function handleError(err) {
  process.exitCode = process.exitCode || 1
  if (err.message.includes('You must supply options.name for UMD bundles')) {
    return logger.error(`You must supply ${chalk.green('options.moduleName')} for UMD bundles, the easiest way is to use ${chalk.green('--moduleName')} flag.\n${getDocRef('api', 'modulename')}`)
  }

  logger.error(err)
}

export function getDocRef(page, id) {
  return chalk.dim(`📖  https://egoist.moe/bili/#/${page}${id ? `?id=${id}` : ''}`)
}
