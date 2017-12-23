const env = process.env.BABEL_ENV || process.env.NODE_ENV

export default ({ jsx } = {}) => {
  jsx = jsx || 'react'

  const presets = [
    env === 'test' ?
      [
        require('babel-preset-env').default,
        {
          modules: false,
          targets: {
            node: 'current'
          }
        }
      ] :
      [
        require('babel-preset-env').default,
        {
          useBuiltIns: true,
          modules: false,
          targets: {
            ie: 9,
            uglify: true
          },
          exclude: [
            'babel-plugin-transform-regenerator',
            'babel-plugin-transform-async-to-generator'
          ]
        }
      ]
  ]

  const plugins = [
    require.resolve('babel-plugin-transform-class-properties'),
    require.resolve('babel-plugin-transform-flow-strip-types'),
    [
      require.resolve('fast-async'),
      {
        compiler: {
          promises: true,
          noRuntime: true
        }
      }
    ],
    [
      require.resolve('babel-plugin-transform-object-rest-spread'),
      {
        useBuiltIns: true
      }
    ],
    require.resolve('babel-plugin-external-helpers')
  ]

  if (jsx === 'vue') {
    presets.push(require.resolve('babel-preset-vue'))
  } else if (jsx === 'react') {
    plugins.push(require.resolve('babel-plugin-transform-react-jsx'))
  } else if (typeof jsx === 'string') {
    plugins.push([
      require.resolve('babel-plugin-transform-react-jsx'),
      { pragma: jsx }
    ])
  }

  return {
    presets,
    plugins
  }
}
