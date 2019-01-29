import { ModuleFormat as RollupFormat } from 'rollup'

import { Banner } from './utils/get-banner'

export type Format =
  | RollupFormat
  | 'cjs-min'
  | 'esm-min'
  | 'umd-min'
  | 'iife-min'
  | 'amd-min'
  | 'system-min'

export type Env = {
  [k: string]: string | number | boolean
}

type External = string | RegExp | ((id: string) => boolean)

export type Externals = Array<External>

export type ConfigEntryObject = { [entryName: string]: string }

export type ExtendConfig = (
  config: NormalizedConfig,
  { format, input }: { format: Format; input: string[] | ConfigEntryObject }
) => NormalizedConfig

export interface BabelPresetOptions {
  /**
   * Transform `async/await` to `Promise`.
   * @default `true`
   */
  asyncToPromises?: boolean
  /**
   * Custom JSX pragma. If you want to use Preact, set it to `h`.
   */
  jsx?: string
  /**
   * Replace `Object.assign` with your own method.
   * @example `myAssign`
   */
  objectAssign?: string
  /**
   * Disable .babelrc
   * By default Bili reads it
   */
  babelrc?: boolean
  /**
   * Disable babel.config.js
   */
  configFile?: boolean
  /**
   * Disable babel-preset-env but still use other babel plugins
   * In addtional we use rollup-plugin-buble after rollup-plugin-babel
   */
  minimal?: boolean
}

interface ConfigOutput {
  /**
   * Output format(s). You can append `min` to the format to generate minified bundle.
   *
   * @default `cjs`
   * @values `cjs` `esm` `umd` `iife` `$format-min`
   * @cli `--format <format>`
   */
  format?: Format | Format[]
  /**
   * Output directory
   * @default `dist`
   * @cli `-d, --out-dir <dir>`
   */
  dir?: string
  /**
   * Output file name
   *
   * Default value:
   * - `[name][min].js` in `cjs` format
   * - `[name][min].mjs` in `esm` format
   * - `[name][min].[format].js` in `umd` and `iife` formats.
   *
   * Placeholders:
   * - `[name]`: The base name of input file. (without extension)
   * - `[format]`: The output format. (without `-min` suffix)
   * - `[min]`: It will replaced by `.min` when the format ends with `-min`, otherwise it's an empty string.
   * @cli `--file-name <fileName>`
   */
  fileName?: string
  /**
   * Module name for umd bundle
   */
  moduleName?: string
  /**
   * Whether to minify output files regardless of format, using this option won't add `.min` suffix to the output file name.
   */
  minify?: boolean
  /**
   * Extract CSS into a single file.
   * @default `true`
   */
  extractCSS?: boolean
}

export interface Config {
  /**
   * Input files
   * @default `src/index.js`
   * @cli `bili [...input]`
   */
  input?: string | ConfigEntryObject | Array<ConfigEntryObject | string>
  output?: ConfigOutput
  /**
   * Define env variables that are only available in your library code. i.e. if you have some code like this in your library.
   *
   * ```js
   * if (process.env.NODE_ENV === 'development') {
   *   console.log('debug')
   * }
   * ```
   *
   * And you can run following command to replace the env variable:

   * ```bash
   * bili --env.NODE_ENV production
   * ```
   *
   * By default we don't add any env variables.
   *
   * @cli `--env.<name> value`
   */
  env?: Env
  /**
   * Use Rollup plugins
   *
   * ```js
   * // bili.config.js
   * module.exports = {
   *   plugins: {
   *     svelte: {
   *      // Any options for rollup-plugin-svelte
   *     }
   *   }
   * }
   * ```
   *
   * You can also use CLI flags to add plugins, e.g.
   * ```bash
   * bili --plugin.svelte
   * # with option
   * bili --plugin.svelte.foo bar
   * # Same as using `svelte: { foo: 'bar' }` in config file
   * ```
   *
   * @cli `--plugin.<name> [option]`
   */
  plugins?: {
    [name: string]: any
  }
  /**
   * Include node modules in the bundle. Note that this is always `true` for UMD bundle.
   */
  bundleNodeModules?: boolean | string[]
  /**
   * When inlining node modules
   * You can use this option to exclude specific modules
   */
  externals?: Externals
  /**
   * Specifies `moduleId: variableName` pairs necessary for external imports in umd/iife bundles. For example, in a case like this...
   *
   * ```js
   * import $ from 'jquery'
   * ```
   *
   * ...you can map the `jquery` module ID to the global `$` variable:
   *
   * ```js
   * // bili.config.js
   * export default {
   *   globals: {
   *     jquery: '$'
   *   }
   * }
   * ```
   *
   * @cli `--global.<moduleId> <variableName`
   */
  globals?: {
    [k: string]: string
  }
  /**
   * Insert a copyright message to the top of output bundle.
   */
  banner?: Banner
  /**
   * Configure the default babel preset
   */
  babel?: BabelPresetOptions
  extendConfig?: ExtendConfig
}

export interface NormalizedConfig {
  input?: string | ConfigEntryObject | Array<ConfigEntryObject | string>
  output: Overwrite<
    ConfigOutput,
    {
      dir: string
    }
  >
  env?: Env
  bundleNodeModules?: boolean | string[]
  plugins: {
    [name: string]: any
  }
  externals: Externals
  globals?: {
    [k: string]: string
  }
  banner?: Banner
  babel: BabelPresetOptions
  extendConfig?: ExtendConfig
}

export interface Options {
  /**
   * Log level
   */
  logLevel?: 'verbose' | 'quiet'
  /**
   * Always show stack trace
   */
  stackTrace?: boolean
  /**
   * Use a custom config file rather than auto-loading bili.config.js
   */
  configFile?: string | boolean
  rootDir?: string
}
