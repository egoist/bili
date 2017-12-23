const a = async () => ({ a: 'a' })

export default a().then(res => ({ ...res }))
