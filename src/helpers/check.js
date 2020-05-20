import { bkitping } from 'src/helpers/bash'
import { ipcRenderer } from 'electron'
import path from 'path'
import fs from 'fs'

export const getbkitlocation = () => ipcRenderer.sendSync('getbKitPath')
export const isBkitClintInstalled = (bKitPath = getbkitlocation()) => {
  return bKitPath && fs.existsSync(bKitPath) && ['run', 'bkit', 'rkit', 'skit', 'dkit'].every(e => {
    const fullpath = path.join(bKitPath, `${e}.sh`)
    return fs.existsSync(fullpath)
  })
}
export const isbkitok = () => isBkitClintInstalled() && bkitping('aqui') === 'aqui'
