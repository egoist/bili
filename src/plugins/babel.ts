import { createBabelInputPluginFactory } from '@rollup/plugin-babel'
import preset from '../babel/preset'
import { BabelPresetOptions } from '../types'

export const a = 1

export default createBabelInputPluginFactory((babelCore) => {
  const presetItem = babelCore.createConfigItem(preset, {
    type: 'preset',
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
          presetOptions,
        },

        // Pass the options back with the two custom options removed.
        pluginOptions,
      }
    },

    // Passed Babel's 'PartialConfig' object.
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

      if (presetOptions.minimal) {
        process.env.BILI_MINIMAL = 'enabled'
      }

      return {
        ...cfg.options,
        presets: [
          ...(cfg.options.presets || []),

          // Include a custom preset in the options.
          presetItem,
        ],
      }
    },
  }
})
