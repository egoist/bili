
const data = { foo: 'bar' }

const tt = 'is there anything?'

function afun() {
  console.log('test')
  return tt
}

export function another() {
  console.log('two')
  return afun()
}

