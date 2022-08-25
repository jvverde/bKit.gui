// let wsList = {}
'use strict'
import { bash } from '../helpers/bash'
import { ipcMain } from 'electron'

ipcMain.handle('killtree', (event, pid) => {
  console.log('Kill tree of process', pid)
  return new Promise((resolve, reject) => {
    bash('./killtree.sh', [pid], { onerror: reject }, resolve)
  })
})

export default false










