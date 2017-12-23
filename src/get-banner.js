import stringifyAuthor from 'stringify-author'

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
  const year = pkg.year || new Date().getFullYear()

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
