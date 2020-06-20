import {
  ModuleFormat as RollupFormat,
  InputOptions,
  OutputOptions,
  Plugin as RollupPlugin,
} from 'rollup'

import { Banner } from './utils/get-banner'

type Diff<T extends keyof any, U extends keyof any> = ({ [P in T]: P } &
  { [P in U]: never } & { [x: string]: never })[T]
type Overwrite<T, U> = Pick<T, Diff<keyof T, keyof U>> & U

export type Format =
  | RollupFormat
  | 'cjs-min'
  | 'es-min'
  | 'esm-min'
  | 'umd-min'
  | 'iife-min'
  | 'amd-min'
  | 'system-min'

export type Env = {
  [k: string]: string | number | boolean
}

export type External =
  | string
  | RegExp
  | ((id: string, parentId?: string) => boolean)

export type Externals = Array<External>

export type ConfigEntryObject = { [entryName: string]: string }

export type ExtendConfig = (
  config: NormalizedConfig,
  { format, input }: { format: Format; input: string[] | ConfigEntryObject }
) => NormalizedConfig

export interface RunContext {
  unresolved: Set<string>
}

export interface Task {
  title: string
  getConfig(context: RunContext, task: Task): Promise<RollupConfig>
}

export interface RollupInputConfig extends InputOptions {
  plugins: Array<RollupPlugin>
}

export interface RollupOutputConfig extends OutputOptions {
  dir: string
}

export interface RollupConfig {
  inputConfig: RollupInputConfig
  outputConfig: RollupOutputConfig
}

export type ExtendRollupConfig = (config: RollupConfig) => RollupConfig

export interface FileNameContext {
  format: RollupFormat
  minify: boolean
}

export type GetFileName = (
  context: FileNameContext,
  defaultFileName: string
) => string

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

export type OutputTarget = 'node' | 'browser'

export interface ConfigOutput {
  /**
   * Output format(s). You can append `min` to the format to generate minified bundle.
   *
   * @default `cjs`
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
   * - `[name][min][ext]` in `cjs` and `esm` format.
   * - `[name][min].[format].js` in other formats.
   *
   * Placeholders:
   * - `[name]`: The base name of input file. (without extension)
   * - `[format]`: The output format. (without `-min` suffix)
   * - `[min]`: It will replaced by `.min` when the format ends with `-min`, otherwise it's an empty string.
   *
   * The value can also be a function which returns the fileName template,
   * The placeholders are also available in the return value.
   *
   * @cli `--file-name <fileName>`
   */
  fileName?: string | GetFileName
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
  /**
   * Generate source maps
   * @default `true` for minified bundle, `false` otherwise
   */
  sourceMap?: boolean
  /**
   * Exclude source code in source maps
   */
  sourceMapExcludeSources?: boolean
  /**
   * Output target
   * @default `node`
   * @cli `--target <target>`
   */
  target?: OutputTarget
}

export interface BundleConfig {
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
   * Defines how to resolve a plugin by name
   * This will override the default behavior
   * e.g.
   * ```js
   * {
   *   resolvePlugins: {
   *     replace: require('./my-fork-of-rollup-plugin-replace')
   *   }
   * }
   * ```
   */
  resolvePlugins?: {
    [name: string]: any
  }
  /**
   * Include node modules in the bundle. Note that this is always `true` for UMD bundle.
   * @cli `--bundle-node-modules`
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
  /**
   * Extending Bili config
   */
  extendConfig?: ExtendConfig
  /**
   * Extending generated rollup config
   */
  extendRollupConfig?: ExtendRollupConfig
}

export type Config = BundleConfig | BundleConfig[]

interface ConfigOutputOverwrite {
  /**
   * Output directory, always a string
   */
  dir: string
}

export interface NormalizedConfig {
  input?: string | ConfigEntryObject | Array<ConfigEntryObject | string>
  output: Overwrite<ConfigOutput, ConfigOutputOverwrite>
  env?: Env
  bundleNodeModules?: boolean | string[]
  plugins: {
    [name: string]: any
  }
  resolvePlugins?: {
    [name: string]: any
  }
  externals: Externals
  globals?: {
    [k: string]: string
  }
  banner?: Banner
  babel: BabelPresetOptions
  extendConfig?: ExtendConfig
  extendRollupConfig?: ExtendRollupConfig
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
  configPath?: string
  /**
   * The root directory to resolve files from
   * Useful for mono-repo
   * e.g. You can install Bili in root directory and leaf packages can use their own Bili config file:
   * - `bili --root-dir packages/foo`
   * - `bili --root-dir packages/bar`
   */
  rootDir?: string
}
