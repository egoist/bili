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
  const presets = [
    !minimal && [
      require('@babel/preset-env').default,
      {
        modules: ENV === 'test' ? 'auto' : false,
        exclude: [
          'transform-regenerator',
          'transform-async-to-generator',
          'proposal-object-rest-spread'
        ]
      }
    ],
    require('@babel/preset-typescript')
  ].filter(Boolean)

  const plugins = [
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
    [require('@babel/plugin-proposal-optional-chaining')],
    [require('@babel/plugin-proposal-nullish-coalescing-operator')],
    [
      alterObjectAssign,
      {
        objectAssign
      }
    ],
    asyncToPromises && [
      // Not documented in README. But it helps to reduce helper function.
      // https://github.com/rpetrich/babel-plugin-transform-async-to-promises/pull/57/files#diff-04c6e90faac2675aa89e2176d2eec7d8
      require('babel-plugin-transform-async-to-promises'),
      {
        externalHelpers: true
      }
    ]
  ].filter(Boolean)

  return {
    presets,
    plugins
  }
}
