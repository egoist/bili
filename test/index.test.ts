import path from 'path'
import { Bundler, Config, Options } from '../src'

process.env.BABEL_ENV = 'anything-not-test'

function fixture(...args: string[]) {
  return path.join(__dirname, 'fixtures', ...args)
}

function generate(config: Config, options: Options) {
  const bundler = new Bundler(config, {
    logLevel: 'quiet',
    configFile: false,
    ...options
  })
  return bundler.run()
}

function snapshot(
  {
    title,
    input,
    cwd
  }: { title: string; input: string | string[]; cwd?: string },
  config?: Config
) {
  test(title, async () => {
    const { bundles } = await generate(
      {
        input,
        ...config
      },
      {
        rootDir: cwd
      }
    )
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
  cwd: fixture('defaults')
})

snapshot(
  {
    title: 'banner:true with date',
    input: 'index.js',
    cwd: fixture('banner/with-date')
  },
  {
    banner: true
  }
)

snapshot(
  {
    title: 'banner:true without any date',
    input: 'index.js',
    cwd: fixture('banner/without-date')
  },
  {
    banner: true
  }
)

snapshot(
  {
    title: 'banner:object',
    input: 'default.js',
    cwd: fixture()
  },
  {
    banner: {
      author: 'author',
      license: 'GPL',
      name: 'name',
      version: '1.2.3'
    }
  }
)

snapshot(
  {
    title: 'banner:string',
    input: 'default.js',
    cwd: fixture()
  },
  {
    banner: 'woot'
  }
)

snapshot(
  {
    title: 'exclude file',
    input: 'index.js',
    cwd: fixture('exclude-file')
  },
  {
    externals: ['./foo.js']
  }
)

snapshot(
  {
    title: 'extendOptions',
    input: ['foo.js', 'bar.js'],
    cwd: fixture('extend-options')
  },
  {
    output: {
      format: ['umd', 'umd-min', 'cjs']
    },
    extendConfig(config, { format }) {
      if (format === 'umd') {
        config.output.moduleName = 'umd'
      }
      if (format.endsWith('-min')) {
        config.output.moduleName = 'min'
      }
      return config
    }
  }
)

snapshot(
  {
    title: 'bundle-node-modules',
    input: 'index.js',
    cwd: fixture('bundle-node-modules')
  },
  {
    bundleNodeModules: true
  }
)

snapshot({
  title: 'async',
  input: 'index.js',
  cwd: fixture('async')
})

snapshot({
  title: 'babel:with-config',
  input: 'index.js',
  cwd: fixture('babel/with-config')
})

snapshot(
  {
    title: 'babel:disable-config',
    input: 'index.js',
    cwd: fixture('babel/with-config')
  },
  {
    babel: {
      babelrc: false
    }
  }
)

snapshot({
  title: 'babel:object-rest-spread',
  input: 'index.js',
  cwd: fixture('babel/object-rest-spread')
})

snapshot(
  {
    title: 'uglify',
    input: 'index.js',
    cwd: fixture('uglify')
  },
  {
    output: {
      format: 'cjs-min'
    }
  }
)

snapshot(
  {
    title: 'inline-certain-modules',
    input: 'index.js',
    cwd: fixture('inline-certain-modules')
  },
  {
    bundleNodeModules: ['fake-module']
  }
)

snapshot(
  {
    title: 'vue plugin',
    input: 'component.vue',
    cwd: fixture('vue')
  },
  {
    plugins: {
      vue: true
    }
  }
)

snapshot({
  title: 'Typescript',
  input: 'index.ts',
  cwd: fixture('typescript')
})

snapshot(
  {
    title: 'custom rollup plugin',
    input: 'index.js',
    cwd: fixture('custom-rollup-plugin')
  },
  {
    plugins: {
      strip: {
        functions: ['console.log']
      }
    }
  }
)

snapshot(
  {
    title: 'target:browser',
    input: 'index.js',
    cwd: fixture('target/browser')
  },
  {
    output: {
      target: 'browser'
    }
  }
)
