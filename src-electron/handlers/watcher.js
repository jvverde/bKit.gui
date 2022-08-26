// let wsList = {}
'use strict'
import { ipcMain } from 'electron'
import { install, remove } from '../helpers/watcher'

ipcMain.on('watchfiles', (event, path) => {
  const callback = (...args) => event.sender.send('watcherEvent', ...args)
  event.returnValue = install(path, callback)
})

ipcMain.on('unwatchfiles', (event, path, id) => {
  remove(path, id)
})

export default false