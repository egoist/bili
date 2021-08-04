import path from 'path'
import fs from 'fs'
import JoyCon from 'joycon'
import logger from './logger'

type fields = 'main' | 'module' | 'cdn' | 'unpkg' | 'jsdeliver'

function addProp(obj: any, prop: fields, val: string, fields: fields[]) {
  return Object.keys(obj).reduce((acc: any, item: string) => {
    if (item === 'main') {
      prop !== 'main' && (acc[item] = obj[item])
      acc[prop] = val
      fields.push(prop)
    } else {
      acc[item] = obj[item]
    }
    return acc
  }, {})
}

export const updatePackage = (
  outputConfig: any,
  rollupOutput: any,
  rootDir: string
): void => {
  const updatedFields: fields[] = []
  const pkgLoader = new JoyCon({
    stopDir: path.dirname(process.cwd())
  })

  const files = rollupOutput.output.map((output: any) => {
    return {
      name: output.name,
      fileName: output.fileName,
      dir: path.relative(rootDir, outputConfig.dir),
      format: outputConfig.format,
      outputDir:
        path.relative(rootDir, outputConfig.dir) + '/' + output.fileName,
      isChunk: !output.isEntry
    }
  })

  const pkg = pkgLoader.loadSync({
    files: ['package.json'],
    cwd: rootDir
  })

  const check = (file: any, format: string) => {
    return (
      file.format === format &&
      file.isChunk === false &&
      ['main', 'index'].includes(file.name)
    )
  }

  for (const file of files) {
    if (check(file, 'cjs'))
      pkg.data = addProp(pkg.data, 'main', file.outputDir, updatedFields)
    if (check(file, 'esm'))
      pkg.data = addProp(pkg.data, 'module', file.outputDir, updatedFields)
    if (check(file, 'umd')) {
      pkg.data = addProp(pkg.data, 'cdn', file.outputDir, updatedFields)
      pkg.data = addProp(pkg.data, 'unpkg', file.outputDir, updatedFields)
      pkg.data = addProp(pkg.data, 'jsdeliver', file.outputDir, updatedFields)
    }
  }

  fs.writeFileSync(
    `${rootDir}/package.json`,
    JSON.stringify(pkg.data, null, 2),
    'utf8'
  )
  logger.success(
    `Updated package.json ${updatedFields.join(',')} ${
      updatedFields.length === 1 ? 'field' : 'fields'
    } \n`
  )
}
