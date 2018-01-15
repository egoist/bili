import chalk from 'chalk'
import logUpdate from 'log-update'

function logError(message) {
  logUpdate('🚨 ', message)
}

export function handleError(err) {
  process.exitCode = process.exitCode || 1
  let msg = ''
  if (err.code === 'PLUGIN_ERROR') {
    msg += chalk.red(`🚨  Error found by "${err.plugin}" plugin:`)
    if (err.codeFrame) {
      msg += `\n${err.message}\n${err.codeFrame}`
    } else if (err.snippet) {
      msg += `\n${err.message}\n${err.snippet}`
    } else {
      msg += `\n${err.stack}`
    }
    return logUpdate(msg)
  }

  if (err.message.includes('You must supply options.name for UMD bundles')) {
    return logError(`You must supply ${chalk.green('options.moduleName')} for UMD bundles, the easiest way is to use ${chalk.green('--moduleName')} flag.\n${getDocRef('api', 'modulename')}`)
  }

  if (err.name === 'BiliError') {
    return logError(err.message)
  }

  if (err.frame) {
    msg += `${err.frame}\n`
  }
  msg += err.stack
  logUpdate(msg)
}

export function getDocRef(page, id) {
  return chalk.dim(`📖  https://egoist.moe/bili/#/${page}${id ? `?id=${id}` : ''}`)
}
