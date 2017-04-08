/* eslint-disable import/prefer-default-export */
import path from 'path'

export function cwd(...args) {
  return path.resolve(process.cwd(), ...args)
}
