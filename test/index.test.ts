import path from 'path'
import { Bundler, Config, BundleConfig, runBundler } from '../src'

process.env.BABEL_ENV = 'anything-not-test'

function fixture(...args: string[]) {
  return path.join(__dirname, 'fixtures', ...args)
}

function snapshot(
  {
    title,
    input,
    cwd,
  }: { title: string; input: string | string[]; cwd?: string },
  cliConfig?: BundleConfig,
  fileConfig: Config = {}
) {
  test(title, async () => {
    const bundler = await runBundler(
      {
        input,
        ...cliConfig,
      },
      fileConfig,
      {
        logLevel: 'quiet',
        rootDir: cwd,
      },
      {}
    )

    const bundles = Array.isArray(fileConfig)
      ? (bundler as Bundler[])
          .map((b) => b.bundles)
          .reduce((b, acc) => {
            return new Set([...acc, ...b])
          }, new Set<any>())
      : (bundler as Bundler).bundles

    for (const bundle of bundles) {
      for (const relative of bundle.keys()) {
        const asset = bundle.get(relative)
        expect(asset && asset.source).toMatchSnapshot(`${title} ${relative}`)
      }
    }
  })
}

snapshot({
  title: 'defaults',
  input: 'index.js',
  cwd: fixture('defaults'),
})

snapshot(
  {
    title: 'banner:true default',
    input: 'index.js',
    cwd: fixture('banner/default'),
  },
  {
    banner: true,
  }
)

snapshot(
  {
    title: 'banner:object',
    input: 'default.js',
    cwd: fixture(),
  },
  {
    banner: {
      author: 'author',
      license: 'GPL',
      name: 'name',
      version: '1.2.3',
    },
  }
)

snapshot(
  {
    title: 'banner:string',
    input: 'default.js',
    cwd: fixture(),
  },
  {
    banner: 'woot',
  }
)

snapshot(
  {
    title: 'exclude file',
    input: 'index.js',
    cwd: fixture('exclude-file'),
  },
  {
    externals: ['./foo.js'],
  }
)

snapshot(
  {
    title: 'extendOptions',
    input: ['foo.js', 'bar.js'],
    cwd: fixture('extend-options'),
  },
  {
    output: {
      format: ['umd', 'umd-min', 'cjs'],
    },
    extendConfig(config, { format }) {
      if (format === 'umd') {
        config.output.moduleName = 'umd'
      }
      if (format.endsWith('-min')) {
        config.output.moduleName = 'min'
      }
      return config
    },
  }
)

snapshot(
  {
    title: 'bundle-node-modules',
    input: 'index.js',
    cwd: fixture('bundle-node-modules'),
  },
  {
    bundleNodeModules: true,
  }
)

snapshot({
  title: 'async',
  input: 'index.js',
  cwd: fixture('async'),
})

snapshot({
  title: 'babel:with-config',
  input: 'index.js',
  cwd: fixture('babel/with-config'),
})

snapshot(
  {
    title: 'babel:disable-config',
    input: 'index.js',
    cwd: fixture('babel/with-config'),
  },
  {
    babel: {
      babelrc: false,
    },
  }
)

snapshot({
  title: 'babel:object-rest-spread',
  input: 'index.js',
  cwd: fixture('babel/object-rest-spread'),
})

snapshot(
  {
    title: 'uglify',
    input: 'index.js',
    cwd: fixture('uglify'),
  },
  {
    output: {
      format: 'cjs-min',
    },
  }
)

snapshot(
  {
    title: 'inline-certain-modules',
    input: 'index.js',
    cwd: fixture('inline-certain-modules'),
  },
  {
    bundleNodeModules: ['fake-module'],
  }
)

snapshot({
  title: 'vue plugin',
  input: 'component.vue',
  cwd: fixture('vue'),
})

snapshot({
  title: 'Typescript',
  input: 'index.ts',
  cwd: fixture('typescript'),
})

snapshot(
  {
    title: 'custom rollup plugin',
    input: 'index.js',
    cwd: fixture('custom-rollup-plugin'),
  },
  {
    plugins: {
      strip: {
        functions: ['console.log'],
      },
    },
  }
)

snapshot(
  {
    title: 'custom scoped rollup plugin',
    input: 'index.js',
    cwd: fixture('custom-scoped-rollup-plugin'),
  },
  {
    plugins: {
      '@rollup/plugin-strip': {
        functions: ['console.log'],
      },
    },
  }
)

snapshot(
  {
    title: '`@rollup/plugin-replace` can accepts custom options',
    input: 'index.js',
    cwd: fixture('custom-scoped-rollup-plugin/replace'),
  },
  {
    plugins: {
      replace: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
    },
  }
)

snapshot(
  {
    title: 'target:browser',
    input: 'index.js',
    cwd: fixture('target/browser'),
  },
  {
    output: {
      target: 'browser',
    },
  }
)

snapshot(
  {
    title: 'umd and iife should drop process.env.NODE_ENV',
    input: 'index.js',
    cwd: fixture('format'),
  },
  {
    output: {
      format: ['umd', 'umd-min', 'iife', 'iife-min'],
      moduleName: 'dropNodeEnv',
    },
  }
)

snapshot(
  {
    title: 'umd and iife should preserve existing env.NODE_ENV',
    input: 'index.js',
    cwd: fixture('format'),
  },
  {
    output: {
      format: ['umd', 'umd-min', 'iife', 'iife-min'],
      moduleName: 'dropNodeEnv',
    },
    env: { NODE_ENV: 'production' },
  }
)

snapshot(
  {
    title: 'multiple bundle instance',
    input: 'index.js',
    cwd: fixture('defaults'),
  },
  {},
  [
    {
      output: {
        format: ['umd'],
        moduleName: 'ins1',
      },
    },
    {
      output: {
        format: ['umd-min'],
        moduleName: 'ins2',
      },
    },
  ]
)
