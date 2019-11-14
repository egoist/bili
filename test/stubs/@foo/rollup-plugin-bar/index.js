const name = '@foo/bar'

module.exports = ({ callback } = {}) => {
  callback(name)
  return { name }
}
