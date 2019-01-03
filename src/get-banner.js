import stringifyAuthor from 'stringify-author'
import firstCommitDate from 'first-commit-date'

export default (banner, pkg) => {
  if (!banner || typeof banner === 'string') {
    return banner
  }

  pkg = typeof banner === 'object' ? { ...pkg, ...banner } : pkg

  const name = pkg.name

  if (typeof name !== 'string') {
    throw new TypeError(`Expect "name" in package.json to be a string but got ${typeof name}.`)
  }

  const version = pkg.version ? `v${pkg.version}` : ''
  let year = pkg.year

  if (!year) {
    try {
      const date = firstCommitDate.sync()
      year = new Date(date).getFullYear()
    } catch (e) {
      year = new Date().getFullYear()
    }
  }

  let author =
    typeof pkg.author === 'string' ?
      pkg.author :
      typeof pkg.author === 'object' ? stringifyAuthor(pkg.author) : ''
  author = author ? author : ''

  const license = pkg.license || ''

  banner =
    '/*!\n' +
    ` * ${name} ${version}\n` +
    ` * (c) ${year}-present ${author}\n` +
    (license && ` * Released under the ${license} License.\n`) +
    ' */'

  return banner
}
