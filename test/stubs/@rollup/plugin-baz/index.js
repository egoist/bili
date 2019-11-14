const name = 'baz'

module.exports = ({ getConfig } = {}) => {
  getConfig(name)
  return { name }
}
