import { warn } from 'src/helpers/notify'
import fs from 'fs-extra'
const path = require('path')
const onlocal = true
export async function* readdir (dir) {
  try {
    const fullpath = path.normalize(dir)
    const stat = await fs.lstat(fullpath)
    if (stat.isDirectory()) {
      const files = await fs.readdir(fullpath)
      for (const file of files) {
        try { // catch error individualy. This way it doesn't ends the loop
          const filename = path.join(fullpath, file)
          const stat = await fs.lstat(filename)
          const isdir = stat.isDirectory()
          yield {
            path: filename,
            name: file,
            isdir,
            onlocal,
            status: 'local',
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
  }
}
