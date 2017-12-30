import chalk from 'chalk'

function logError(message) {
  console.error('🚨 ', message)
}

export function handleError(err) {
  process.exitCode = process.exitCode || 1

  if (err.code === 'PLUGIN_ERROR') {
    logError(`Error found by ${err.plugin} plugin:`)
    if (err.codeFrame) {
      console.error(err.message)
      console.error(err.codeFrame)
    } else if (err.snippet) {
      console.error(err.message)
      console.error(err.snippet)
    } else {
      console.error(err.stack)
    }
    return
  }

  if (err.message.includes('You must supply options.name for UMD bundles')) {
    return logError(`You must supply ${chalk.green('options.moduleName')} for UMD bundles, the easiest way is to use ${chalk.green('--moduleName')} flag.\n${getDocRef('api', 'modulename')}`)
  }

  if (err.name === 'BiliError') {
    return logError(err.message)
  }

  if (err.frame) {
    console.log(err.frame)
  }
  console.log(err.stack)
}

export function getDocRef(page, id) {
  return chalk.dim(`📖  https://egoist.moe/bili/#/${page}${id ? `?id=${id}` : ''}`)
}
