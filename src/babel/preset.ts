import alterObjectAssign from 'babel-plugin-alter-object-assign'

export default (
  context: any,
  {
    asyncToPromises = process.env.BILI_ASYNC_TO_PROMISES,
    jsx = process.env.BILI_JSX,
    objectAssign = process.env.BILI_OBJECT_ASSIGN
  } = {}
) => {
  const presets: any[] = []
  let plugins: any[] = []

  presets.push(
    [
      require('@babel/preset-env').default,
      {
        modules: false,
        exclude: ['transform-regenerator', 'transform-async-to-generator']
      }
    ],
    require('@babel/preset-typescript')
  )

  plugins = [
    ...plugins,
    require('@babel/plugin-syntax-dynamic-import'),
    [
      require('@babel/plugin-transform-react-jsx'),
      {
        pragma: jsx === 'react' ? 'React.createElement' : jsx
      }
    ],
    [
      require('@babel/plugin-proposal-object-rest-spread'),
      {
        useBuiltIns: true,
        loose: true
      }
    ],
    [
      alterObjectAssign,
      {
        objectAssign
      }
    ],
    asyncToPromises && require('babel-plugin-transform-async-to-promises')
  ].filter(Boolean)

  return {
    presets,
    plugins
  }
}
