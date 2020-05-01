declare module '*.json'

declare module 'tinydate' {
  type Tinydate = (template: string) => (date?: Date) => string
  const tinydate: Tinydate
  export = tinydate
}

declare module 'rollup-plugin-babel' {
  import { createConfigItem } from '@babel/core'
  interface BabelPlugin {
    custom: (
      callback: (
        babelCore: { createConfigItem: typeof createConfigItem }
      ) => any
    ) => any
  }
  const babelPlugin: BabelPlugin
  export default babelPlugin
}

declare module 'babel-plugin-alter-object-assign'

declare module 'text-table' {
  interface Options {
    stringLength?(str: string): number
  }
  type Table = (rows: Array<Array<string>>, opts?: Options) => string
  const table: Table
  export = table
}

declare module 'resolve'
declare module 'stringify-author' {
  type Stringify = (author: any) => string
  const stringify: Stringify
  export = stringify
}
