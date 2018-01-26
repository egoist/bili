import path from 'path'

export const relativePath = p => path.relative(process.cwd(), path.resolve(p))
