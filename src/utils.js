import logUpdate from 'log-update'

export function logAndPersist(...args) {
  logUpdate(...args)
  logUpdate.done()
}
