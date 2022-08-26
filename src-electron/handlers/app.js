'use strict'
import { app, ipcMain } from 'electron'

ipcMain.on('getApp', (event) => {
  event.returnValue = {
    version: app.getVersion(),
    name: app.getName()    
  }
})

export default false
