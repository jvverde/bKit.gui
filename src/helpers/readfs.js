import { warn } from 'src/helpers/notify'
import fs from 'fs'
import path from 'path'

// const onlocal = true

const getType = stat => stat.isFile() ? 'f' : stat.isDirectory() ? 'd' : stat.isFIFO() ? 'p' : stat.isSocket()
  ? 's' : stat.isSymbolicLink() ? 'l' : stat.isBlockDevice() ? 'b' : stat.isCharacterDevice() ? 'c' : undefined

export async function* readdir (dir) {
  try {
    const fullpath = path.normalize(`${dir}/`)
    const stat = await fs.promises.lstat(fullpath)
    if (stat.isDirectory()) {
      const files = await fs.promises.readdir(fullpath)
      for await (const file of files) {
        try { // catch error individualy. This way it doesn't ends the loop
          const filename = path.join(fullpath, file)
          const stat = await fs.promises.lstat(filename)
          // const isdir = stat.isDirectory()
          const type = getType(stat)
          yield {
            path: filename,
            name: file,
            type,
            // isdir,
            // isfile: !isdir,
            // onlocal
            stat
          }
        } catch (err) {
          warn(err, false)
        }
      }
    } else {
      const name = path.basename(fullpath)
      const type = getType(stat)
      yield {
        path: fullpath,
        name,
        type,
        // onlocal,
        // isfile: true,
        stat
      }
    }
  } catch (err) {
    warn(err, false)
  }
}

export async function readfile (path, ...args) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path)) reject(`Not found '${path}'`)
    fs.readFile(path, ...args).then(resolve).catch(reject)
  })
}
