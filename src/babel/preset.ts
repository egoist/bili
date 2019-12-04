import alterObjectAssign from 'babel-plugin-alter-object-assign'

const ENV = process.env.BABEL_ENV || process.env.NODE_ENV

export default (
  context: any,
  {
    asyncToPromises = process.env.BILI_ASYNC_TO_PROMISES,
    jsx = process.env.BILI_JSX,
    objectAssign = process.env.BILI_OBJECT_ASSIGN,
    minimal = process.env.BILI_MINIMAL
  } = {}
) => {
  let presets: any[] = []
  let plugins: any[] = []

  presets = [
    ...presets,
    !minimal && [
      require('@babel/preset-env').default,
      {
        modules: ENV === 'test' ? 'auto' : false,
        exclude: ['transform-regenerator', 'transform-async-to-generator']
      }
    ],
    require('@babel/preset-typescript')
  ].filter(Boolean)

  plugins = [
    ...plugins,
    require('@babel/plugin-external-helpers'),
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
