import path from 'path'
import chalk from 'chalk'
import logUpdate from 'log-update'

export default () => {
  let bundling = 0
  return {
    name: 'bili-progress',
    transform(code, id) {
      logUpdate(`Bundling ${chalk.cyan(++bundling)} file${
        bundling > 1 ? 's' : ''
      }: ${chalk.green(path.relative(process.cwd(), id))}`)
    },
    ongenerate() {
      bundling = 0
    }
  }
}
