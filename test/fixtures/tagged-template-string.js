
const [a, b] = [5, 10]

export default fn`a=${a}b=${b}`

function fn (pieces) { return pieces.slice(0, -1) }