<img src="./media/logo.png" alt="logo"/><br>

<a href="https://npmjs.com/package/bili"><img src="https://img.shields.io/npm/v/bili.svg?style=flat-square" alt="NPM version"></a>
<a href="https://npmjs.com/package/bili"><img src="https://img.shields.io/npm/dm/bili.svg?style=flat-square" alt="NPM downloads"></a>
<a href="https://circleci.com/gh/egoist/bili/tree/master"><img src="https://img.shields.io/circleci/project/egoist/bili/master.svg?style=flat-square"></a>
<a href="https://codecov.io/gh/egoist/bili"><img src="https://img.shields.io/codecov/c/github/egoist/bili.svg?style=flat-square"></a>

## tl;dr

```bash
# previously named `bubleup`
$ bili
# is the same as
$ bili src/index.js --out-dir dist

# watch mode
$ bili --watch
```

## Why is this useful?

I always repeat the same configurations for bundling my javascript libraries. With bili you can simply run `bili` to generate `commonjs`-format code and or append `--format umd` to generate `umd`-format code, and it's fast! You can even pass `--compress` to generate compressed file and sourcemap.

## Install

```bash
$ npm install -g bili
```

[Dive into the wiki](https://github.com/universe-denpa/bili/wiki) if you are ready to bundle!

## License

MIT © [EGOIST](https://github.com/egoist)
