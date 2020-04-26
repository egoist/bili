let a = ''
let b = ''

if (process.env.NODE_ENV === 'development') {
  a = 'live in dev'
} else {
  a = 'live in prod'
}

if (process.env.NODE_ENV === 'production') {
  b = 'live in prod'
} else {
  b = 'live in dev'
}

export { a, b }
