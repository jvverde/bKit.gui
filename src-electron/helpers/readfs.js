import fs from 'fs'
import path from 'path'
import say from '../utils/say'

// const onlocal = true

const getType = stat => stat.isFile() ? 'f' : stat.isDirectory() ? 'd' : stat.isFIFO() ? 'p' : stat.isSocket()
  ? 's' : stat.isSymbolicLink() ? 'l' : stat.isBlockDevice() ? 'b' : stat.isCharacterDevice() ? 'c' : undefined

async function* _readdir (dir) {
  try {
    const fullpath = path.normalize(`${dir}/`)
    const stat = await fs.promises.lstat(fullpath)
    if (stat.isDirectory()) {
      const files = await fs.promises.readdir(fullpath)
      for await (const file of files) {
        const filename = path.join(fullpath, file)
        try { // catch error individualy. This way it doesn't ends the loop
          const stat = await fs.promises.lstat(filename)
          // const isdir = stat.isDirectory()
          const type = getType(stat)
          yield {
            path: filename,
            name: file,
            type,
            stat
          }
        } catch (err) {
          yield {
            path: filename,
            name: file,
            type: undefined,
            err
          }
          say.warn(err, false)
        }
      }
    } else {
      const name = path.basename(fullpath)
      const type = getType(stat)
      yield {
        path: fullpath,
        name,
        type,
        stat
      }
    }
  } catch (err) {
    say.error(err, false)
  }
}

export async function readdir (dir) {
  const result = []
  const entries = await _readdir(dir)
  for await (const entry of entries) {
    result.push(entry)
  }
  return result
}

export async function readfile (path, ...args) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path)) reject(`Not found '${path}'`)
    fs.readFile(path, ...args).then(resolve).catch(reject)
  })
}
