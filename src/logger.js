import logUpdate from 'log-update'
import chalk from 'chalk'
import emoji from './emoji'
import { relativePath } from './util'

const prettyPluginName = name => {
  return name === 'rpt2' ? 'typescript2' : name
}

const prettyPluginError = err => {
  if (err.plugin === 'rpt2') {
    return err.message.replace(/\.ts\((\d+),(\d+)\):\s*/, '.ts:$1:$2\n')
  }
  return err.message
}

const prettyError = err => {
  if (err.name === 'BiliError') {
    return {
      message: err.message
    }
  }

  let message
  const frames = []

  if (err.plugin) {
    message = `(${prettyPluginName(err.plugin)}) ${prettyPluginError(err)}`
    frames.push(err.codeFrame || err.snippet)
  } else {
    message = err.message
    if (err.loc) {
      message += ` at ${relativePath(err.loc.file || err.id)}:${err.loc.line}:${
        err.loc.column
      }`
    }
    if (err.url) {
      frames.push(err.url)
    }
    frames.push(chalk.red(err.frame || err.stack))
  }

  return {
    message,
    frames: frames.join('\n')
  }
}

class Logger {
  constructor(options) {
    this.setOptions(options)
  }

  setOptions(options = {}) {
    this.logLevel = typeof options.logLevel === 'number' ? options.logLevel : 3
    this.useLogUpdate =
      typeof options.logUpdate === 'boolean' ? options.logUpdate : true
  }

  clear() {
    if (this.useLogUpdate) {
      logUpdate.clear()
    }
  }

  write(message, persistent = false) {
    if (persistent) {
      this.clear()
      console.log(message)
      return
    }
    if (this.useLogUpdate) {
      logUpdate(message)
    } else {
      console.log(message)
    }
  }

  // Debug message
  // Always persisted
  debug(message) {
    if (this.logLevel < 4) {
      return
    }

    this.write(message, true)
  }

  // Normal log
  // Persist by default
  log(message, update) {
    if (this.logLevel < 3) {
      return
    }

    this.write(message, !update)
  }

  // Warn status
  warn(message) {
    if (this.logLevel < 2) {
      return
    }

    this.status(emoji.warning, message)
  }

  // Error status
  error(err) {
    if (this.logLevel < 1) {
      return
    }

    if (typeof err === 'string') {
      return this.status(emoji.error, err)
    }

    let { message, frames } = prettyError(err)

    this.status(emoji.error, message)
    if (frames) {
      console.error(frames)
    }
  }

  // Status message should be persisted
  // Unless `update` is set
  // Mainly used in `progress-plugin.js`
  status(emoji, message, update) {
    if (this.logLevel < 3) {
      return
    }

    if (update && this.useLogUpdate) {
      return logUpdate(`${emoji}  ${message}`)
    }

    this.clear()
    console.log(`${emoji}  ${message}`)
  }
}

export default new Logger()
