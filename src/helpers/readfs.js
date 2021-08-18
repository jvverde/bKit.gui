import { warn } from 'src/helpers/notify'
import fs from 'fs'
import path from 'path'

const onlocal = true

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
          const isdir = stat.isDirectory()
          yield {
            path: filename,
            name: file,
            isdir,
            onlocal,
            isfile: !isdir,
            stat
          }
        } catch (err) {
          warn(err, false)
        }
      }
    } else {
      const name = path.basename(fullpath)
      yield {
        path: fullpath,
        name,
        onlocal,
        isfile: true,
        stat
      }
    }
  } catch (err) {
    warn(err, false)
    throw err
  }
}

export async function readfile (path, ...args) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path)) reject(`Not found '${path}'`)
    fs.readFile(path, ...args).then(resolve).catch(reject)
  })
}
