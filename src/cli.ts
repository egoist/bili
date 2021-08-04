#!/usr/bin/env node
import 'v8-compile-cache'
import { cac } from 'cac'
import { version } from '../package.json'

if (process.env.BILI_LOCAL_PROFILE) {
  const requireSoSlow = require('require-so-slow')
  process.on('exit', () => {
    requireSoSlow.write('require-trace.trace')
  })
}

const cli = cac('bili')

cli
  .command('[...input]', 'Bundle input files', {
    ignoreOptionDefaultValue: true,
  })
  .option('-w, --watch', 'Watch files')
  .option(
    '--format <format>',
    'Output format (cjs | umd | es  | iife), can be used multiple times'
  )
  .option('--input.* [file]', 'An object mapping names to entry points')
  .option('-d, --out-dir <outDir>', 'Output directory', { default: 'dist' })
  .option('--root-dir <rootDir>', 'The root directory to resolve files from')
  .option('--file-name <name>', 'Set the file name for output files')
  .option('--module-name <name>', 'Set the module name for umd bundle')
  .option('--update-pkg', 'Updates your package.json entry fields')
  .option('--env.* [value]', 'Replace env variables')
  .option('--plugin, --plugins.* [options]', 'Use a plugin')
  .option(
    '--global.* [path]',
    'id:moduleName pair for external imports in umd/iife bundles'
  )
  .option('--no-extract-css', 'Do not extract CSS files')
  .option('--bundle-node-modules', 'Include node modules in your bundle')
  .option('--minify', 'Minify output files')
  .option('--external <id>', 'Mark a module id as external', {
    type: [],
  })
  .option('-t, --target <target>', 'Output target', { default: 'node' })
  .option('-c, --config <file>', 'Use a custom config file')
  .option('--minimal', 'Generate minimal output whenever possible')
  .option('--no-babelrc', 'Disable .babelrc file')
  .option('--banner', 'Add banner with pkg info to the bundle')
  .option(
    '--no-map',
    'Disable source maps, enabled by default for minified bundles'
  )
  .option('--map-exclude-sources', 'Exclude source code in source maps')
  .option('--no-async-pro, --no-async-to-promises', 'Leave async/await as is')
  .option('--concurrent', 'Build concurrently')
  .option('--verbose', 'Show verbose logs')
  .option('--quiet', 'Show minimal logs')
  .option('--stack-trace', 'Show stack trace for bundle errors')
  .example((bin) => `  ${bin} --format cjs --format esm`)
  .example((bin) => `  ${bin} src/index.js,src/cli.ts`)
  .example((bin) => `  ${bin} --input.index src/foo.ts`)
  .action(async (input, options) => {
    const { Bundler } = await import('./')
    const rootDir = options.rootDir || '.'
    const bundler = new Bundler(
      {
        input: options.input || (input.length === 0 ? undefined : input),
        output: {
          format: options.format,
          dir: options.outDir,
          moduleName: options.moduleName,
          fileName: options.fileName,
          minify: options.minify,
          extractCSS: options.extractCss,
          sourceMap: options.map,
          sourceMapExcludeSources: options.mapExcludeSources,
          target: options.target,
        },
        bundleNodeModules: options.bundleNodeModules,
        env: options.env,
        plugins: options.plugins,
        externals: options.external,
        globals: options.global,
        banner: options.banner,
        updatePkg: options.updatePkg,
        babel: {
          asyncToPromises: options.asyncToPromises,
          minimal: options.minimal,
          babelrc: options.babelrc,
        },
      },
      {
        logLevel: options.verbose
          ? 'verbose'
          : options.quiet
          ? 'quiet'
          : undefined,
        stackTrace: options.stackTrace,
        configFile: options.config,
        rootDir,
      }
    )
    await bundler
      .run({
        write: true,
        watch: options.watch,
        concurrent: options.concurrent,
      })
      .catch((err: any) => {
        bundler.handleError(err)
        process.exit(1)
      })
  })

cli.version(version)
cli.help()

cli.parse()

process.on('unhandledRejection', (err) => {
  console.error(err)
  process.exit(1)
})
