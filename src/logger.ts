import colors from 'chalk'
import spinner from './spinner'

interface Options {
  logLevel?: 'verbose' | 'quiet'
}

class Logger {
  options: Options

  constructor(options?: Options) {
    this.options = options || {}
  }

  setOptions(options: Options) {
    Object.assign(this.options, options)
  }

  get isDebug() {
    return this.options.logLevel === 'verbose'
  }

  get isQuiet() {
    return this.options.logLevel === 'quiet'
  }

  warn(...args: any[]) {
    this.log(colors.yellow('warning'), ...args)
  }

  error(...args: any[]) {
    this.log(colors.red('error'), ...args)
  }

  success(...args: any[]) {
    this.log(colors.green('success'), ...args)
  }

  log(...args: any[]) {
    spinner.stop()
    if (this.isQuiet) return
    console.log(...args)
  }

  debug(...args: any[]) {
    if (!this.isDebug) return
    this.log(colors.magenta('verbose'), ...args)
  }

  progress(text: string) {
    if (this.isQuiet) return
    spinner.start(text)
  }
}

export default new Logger()
