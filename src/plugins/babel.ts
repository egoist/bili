import babel from 'rollup-plugin-babel'
import preset from '../babel/preset'
import { BabelPresetOptions } from '../types'

export default babel.custom((core: any) => {
  const presetItem = core.createConfigItem(preset, {
    type: 'preset'
  })

  return {
    // Passed the plugin options.
    options({
      presetOptions,
      ...pluginOptions
    }: {
      presetOptions: BabelPresetOptions
    }) {
      return {
        // Pull out any custom options that the plugin might have.
        customOptions: {
          presetOptions
        },

        // Pass the options back with the two custom options removed.
        pluginOptions
      }
    },

    config(cfg: any, data: any) {
      if (cfg.hasFilesystemConfig()) {
        // Use the normal config
        return cfg.options
      }

      const presetOptions: BabelPresetOptions = data.customOptions.presetOptions

      // We set the options for default preset using env vars
      // So that you can use our default preset in your own babel.config.js
      // And our options will still work
      if (presetOptions.asyncToPromises) {
        process.env.BILI_ASYNC_TO_PROMISES = 'enabled'
      }

      if (presetOptions.jsx) {
        process.env.BILI_JSX = presetOptions.jsx
      }

      if (presetOptions.objectAssign) {
        process.env.BILI_OBJECT_ASSIGN = presetOptions.objectAssign
      }

      return {
        ...cfg.options,
        presets: [
          ...(cfg.options.presets || []),

          // Include a custom preset in the options.
          presetItem
        ]
      }
    }
  }
})
