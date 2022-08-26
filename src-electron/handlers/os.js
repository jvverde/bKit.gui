// let wsList = {}
'use strict'
import os from 'os'
import { ipcMain } from 'electron'

ipcMain.on('os', (event) => {
  event.returnValue = {
    userInfo: os.userInfo(),
    platform: os.platform(),
    hostname: os.hostname()
  }
})

export default false