import logUpdate from 'log-update'
import emoji from './emoji'

const prettyError = err => {
  let message
  let stack
  if (err.plugin) {
    message = `(${err.plugin}) ${err.message}`
    stack = err.codeFrame || err.snippet || err.stack
  } else {
    message = err.message
    stack = err.stack
  }

  return {
    message,
    stack
  }
}

export default class Logger {
  constructor(options = {}) {
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

    let { message, stack } = prettyError(err)

    this.status(emoji.error, message)
    console.log(stack)
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
