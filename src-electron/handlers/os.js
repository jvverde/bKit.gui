// let wsList = {}
'use strict'
import os from 'os'
import { ipcMain } from 'electron'

ipcMain.handle('os', () => {
  return {
    userInfo: os.userInfo(),
    platform: os.platform(),
    hostname: os.hostname(),
    userInfo: os.userInfo()
  }
})

export default {}