// SEE this when possible
// https://stackoverflow.com/questions/44391448/electron-require-is-not-defined

import { app, ipcMain } from 'electron'
import { bkitPath } from './bkitClient'
import { get_preferences, set_preferences, save_preferences } from './preferences'
import say from './say'

export default async () => false

ipcMain.on('getbkitPath', (event) => {
  const location = bkitPath()
  say.log('getbkitPath', location)
  event.returnValue = location || findbkit()
})

ipcMain.on('getStatics', (event) => {
  say.log('getStatics', statics)
  event.returnValue = statics
})

ipcMain.on('app_version', (event) => {
  event.returnValue = app.getVersion()
})

ipcMain.on('getPath', (event, name) => {
  event.returnValue = app.getPath(name)
})

const keytar = require('keytar')

ipcMain.on('findCredentials', async (event) => {
  say.log('findCredentials')
  try {
    const credentials = await keytar.findCredentials('bKit')
    event.returnValue = credentials
  } catch (e) {
    say.error('[findCredentials]', e)
    event.returnValue = []
  }
})

ipcMain.on('setPassword', async (event, account, password) => {
  try {
    say.log('setPassword', account)
    keytar.setPassword('bKit', account, password)
    event.returnValue = true
  } catch (e) {
    say.error('[setPassword]', e)
    event.returnValue = false
  }
})

ipcMain.on('getPassword', async (event, account) => {
  try {
    say.log('getPassword', account)
    const pass = await keytar.getPassword('bKit', account)
    event.returnValue = pass
  } catch (e) {
    say.error('[getPassword]', e)
    event.returnValue = undefined
  }
})

ipcMain.on('deletePassword', async (event, account) => {
  try {
    say.log('deletePassword', account)
    const result = await keytar.deletePassword('bKit', account)
    event.returnValue = result
  } catch (e) {
    say.error('[deletePassword]', e)
    event.returnValue = undefined
  }
})

/* Preferences */

ipcMain.on('setPreferences', async (event, prefs) => {
  try {
    // say.log('set_preferences', prefs)
    set_preferences(prefs)
    event.returnValue = true
  } catch (e) {
    say.error('[setPreferences]', e)
    event.returnValue = false
  }
})

ipcMain.on('getPreferences', async (event) => {
  try {
    // say.log('preferences', get_preferences())
    event.returnValue = get_preferences()
  } catch (e) {
    say.error('[getPreferences]', e)
    event.returnValue = {}
  }
})

app.on('before-quit', () => {
  say.log('Save preferences before quit') 
  save_preferences()
})
