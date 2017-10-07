/* eslint-disable import/prefer-default-export */
import path from 'path'
import chalk from 'chalk'
import log from './log'

export function cwd(...args) {
  return path.resolve(process.cwd(), ...args)
}

export function handleRollupError(error) {
  log(error.plugin || 'error', error.message, chalk.red)
  if (error.id) {
    console.log(chalk.dim(`Location: ${error.id}`))
  }
  console.error(error.snippet || error)
  console.log()
  process.exitCode = 1
}
