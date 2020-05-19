import { ipcRenderer } from 'electron'
import path from 'path'
import fs from 'fs'

export const isBkitClintInstalled = (bKitPath = ipcRenderer.sendSync('getbKitPath')) => {
  return bKitPath && fs.existsSync(bKitPath) && ['run', 'bkit', 'rkit', 'skit', 'dkit'].every(e => {
    const fullpath = path.join(bKitPath, `${e}.sh`)
    return fs.existsSync(fullpath)
  })
}
