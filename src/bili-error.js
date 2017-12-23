export default class BiliError extends Error {
  constructor(message) {
    super(message)
    this.name = 'BiliError'
  }
}
