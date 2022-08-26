'use strict'
import { ipcMain } from 'electron'
import { writeFile } from '../helpers/writefs' 

ipcMain.handle('writeFile', async (event, ...args) => {
  return await writeFile(...args)
})

export default false