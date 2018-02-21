const env = process.env.BABEL_ENV || process.env.NODE_ENV

export default (ctx, { jsx, buble, objectAssign, env: envOption } = {}) => {
  jsx = jsx || 'react'

  let presets = []
  let plugins = []

  if (jsx === 'vue') {
    presets.push(require.resolve('babel-preset-vue'))
  } else if (jsx === 'react') {
    plugins.push(require.resolve('@babel/plugin-transform-react-jsx'))
  } else if (typeof jsx === 'string') {
    plugins.push([
      require.resolve('@babel/plugin-transform-react-jsx'),
      { pragma: jsx }
    ])
  }

  plugins.push(
    [
      require.resolve('fast-async'),
      {
        spec: true
      }
    ],
    require.resolve('@babel/plugin-transform-flow-strip-types'),
    [
      require.resolve('@babel/plugin-proposal-object-rest-spread'),
      {
        useBuiltIns: true
      }
    ],
    [
      require.resolve('babel-plugin-alter-object-assign'),
      {
        objectAssign
      }
    ]
  )

  if (buble) {
    return {
      presets,
      plugins
    }
  }

  presets = [
    ...presets,
    env === 'test' ?
      [
        require('@babel/preset-env').default,
        {
          modules: false,
          targets: {
            node: 'current'
          },
          ...envOption
        }
      ] :
      [
        require('@babel/preset-env').default,
        {
          // Never polyfill something like `Promise` `Proxy`
          // Since we're building a library instead of an app
          // You should not include polyfill in your lib anyways
          useBuiltIns: false,
          modules: false,
          targets: {
            ie: 9
          },
          exclude: ['transform-regenerator', 'transform-async-to-generator'],
          ...envOption
        }
      ]
  ]

  plugins = [
    ...plugins,
    require.resolve('@babel/plugin-proposal-class-properties')
  ]

  return {
    presets,
    plugins
  }
}
