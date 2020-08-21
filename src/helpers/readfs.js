import { warn } from 'src/helpers/notify'
import fs from 'fs'

const path = require('path')
const onlocal = true

export async function* readdir (dir) {
  try {
    const fullpath = path.normalize(`${dir}/`)
    console.log('lstat', fullpath)
    const stat = fs.lstatSync(fullpath)
    if (stat.isDirectory()) {
      console.log('fs.readdir', fullpath)
      const files = fs.readdirSync(fullpath)
      console.log('for each file', files)
      for (const file of files) {
        console.log('file', file)
        try { // catch error individualy. This way it doesn't ends the loop
          const filename = path.join(fullpath, file)
          console.log('lstat', filename)
          const stat = fs.lstatSync(filename)
          const isdir = stat.isDirectory()
          console.log('isdir', isdir)
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
