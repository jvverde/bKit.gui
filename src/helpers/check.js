import { bkitping } from 'src/helpers/bash'
import { ipcRenderer } from 'electron'
import path from 'path'
import { readFileSync, existsSync } from 'fs'

const _getList = () => {
  try {
    const depends = path.join(__statics, '/depends.lst')
    const result = readFileSync(depends, 'utf8')
    return result.split(/\r*\n+/).filter(e => e.match(/\.sh$/))
  } catch (err) {
    console.error('Catch _getList:', err)
  }
}
const list = _getList() || []
console.log('list', list)

export const getbkitlocation = () => ipcRenderer.sendSync('getbKitPath')
export const isBkitClintInstalled = (bKitPath = getbkitlocation()) => {
  return bKitPath && existsSync(bKitPath) && list.every(e => {
    const fullpath = path.join(bKitPath, e)
    return existsSync(fullpath)
  })
}
export const isbkitok = () => isBkitClintInstalled() && bkitping('aqui') === 'aqui'
