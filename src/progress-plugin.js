import path from 'path'
import chalk from 'chalk'
import emoji from './emoji'

export default ({ logger }) => {
  let bundling = 0
  return {
    name: 'bili-progress',
    transform(code, id) {
      logger.status(
        emoji.progress,
        `Bundling ${chalk.cyan(++bundling)} file${
          bundling > 1 ? 's' : ''
        }: ${chalk.green(path.relative(process.cwd(), id))}`,
        true
      )
    },
    ongenerate() {
      bundling = 0
    }
  }
}
