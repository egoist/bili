const env = process.env.BABEL_ENV || process.env.NODE_ENV

export default (ctx, { jsx, buble, objectAssign } = {}) => {
  jsx = jsx || 'react'

  let presets = []
  let plugins = []

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

  plugins.push(
    [
      require.resolve('fast-async'),
      {
        compiler: {
          promises: true,
          noRuntime: true
        }
      }
    ],
    require.resolve('babel-plugin-transform-flow-strip-types'),
    [
      require.resolve('babel-plugin-transform-object-rest-spread'),
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

  plugins = [
    ...plugins,
    require.resolve('babel-plugin-transform-class-properties'),
    require.resolve('babel-plugin-external-helpers')
  ]

  return {
    presets,
    plugins
  }
}
