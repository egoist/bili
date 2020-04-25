const data = { foo: 'bar' }

if (process.env.NODE_ENV === 'production') {
  console.log('prod')
} else {
  console.log('dev')
}

let a = 27

if (process.env.NODE_ENV === 'development') {
  a++
} else {
  a--
}

console.log(a)
