const a = { a: 1 }

export default async () => {
  return { ...a, b: this.b }
}
