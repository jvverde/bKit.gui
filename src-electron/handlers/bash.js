// let wsList = {}
'use strict'
import { ipcMain } from 'electron'
import { asyncBash } from '../helpers/bash'

ipcMain.handle('bash', (event, name, args = [], actions = [], index = 0) => {
  const events = {}
  actions.forEach(a => {
    events[a] = (...args) => event.sender.send(`${a}.${index}`, ...args)
  })
  return asyncBash(name, args, events)
})

export default false