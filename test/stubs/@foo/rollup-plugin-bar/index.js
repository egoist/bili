const name = '@foo/bar'

module.exports = ({ getConfig } = {}) => {
  getConfig(name)
  return { name }
}
