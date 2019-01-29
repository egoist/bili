import stringifyAuthor from 'stringify-author'

interface BannerInfo {
  /** Author name */
  name?: string
  /** package version */
  version?: string
  /** Author name or object */
  author?: any
  /** License name, like MIT */
  license?: string
}

export type Banner = string | BannerInfo | boolean

export default (banner?: Banner, pkg?: { [k: string]: any }): string => {
  if (!banner || typeof banner === 'string') {
    return banner || ''
  }

  banner = { ...pkg, ...(banner === true ? {} : banner) }

  const author =
    typeof banner.author === 'string'
      ? banner.author
      : typeof banner.author === 'object'
      ? stringifyAuthor(banner.author)
      : ''

  const license = banner.license || ''

  return (
    '/*!\n' +
    ` * ${banner.name} v${banner.version}\n` +
    ` * (c) ${author || ''}\n` +
    (license && ` * Released under the ${license} License.\n`) +
    ' */'
  )
}
