import { ipcRenderer } from 'electron'
import path from 'path'
import fs from 'fs'

const isBkitClintInstalled = () => {
  const bKitPath = ipcRenderer.sendSync('getbKitPath')
  return bKitPath && fs.existsSync(bKitPath) && ['run', 'bkit', 'rkit', 'skit', 'dkit'].every(e => {
    const fullpath = path.join(bKitPath, `${e}.sh`)
    return fs.existsSync(fullpath)
  })
}

export function setServer (state, server) {
  state.server = server
}
export function setbkitLocation (state, location) {
  state.bkitlocation = location
}
export function setbkitInstalled (state, val) {
  state.bkitinstalled = val
}
export function checkbkitInstalled (state) {
  state.bkitinstalled = isBkitClintInstalled()
}
