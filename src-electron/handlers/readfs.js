'use strict'
import { ipcMain } from 'electron'
import { readfile, readdir } from '../helpers/readfs' 

ipcMain.handle('readfile', async (event, ...args) => {
  return await readile(...args)
})
ipcMain.handle('readdir', async (event, ...args) => {
  return await readdir(...args)
})

export default false