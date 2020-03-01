import { warn } from 'src/helpers/notify'
import fs from 'fs-extra'
const path = require('path')

export async function* readdir (dir) {
  try {
    const stat = await fs.lstat(dir)
    if (stat.isDirectory()) {
      const files = await fs.readdir(dir)
      for (const file of files) {
        try { // catch error individualy. This way it doesn't ends the loop
          const fullpath = path.join(dir, file)
          const stat = await fs.lstat(fullpath)
          const isdir = stat.isDirectory()
          yield {
            path: fullpath,
            name: file,
            isdir,
            isfile: !isdir,
            stat
          }
        } catch (err) {
          warn(err)
        }
      }
    } else {
      const fullpath = path.normalize(dir)
      const name = path.basename(fullpath)
      yield {
        path: fullpath,
        name,
        isfile: true,
        stat
      }
    }
  } catch (err) {
    warn(err)
  }
}
