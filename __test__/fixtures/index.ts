interface foo {
  bar: number
}

export default function ({
  a = 123
} = {}) {
  return a
}
