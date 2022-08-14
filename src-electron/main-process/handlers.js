// SEE this when possible
// https://stackoverflow.com/questions/44391448/electron-require-is-not-defined

import { app, ipcMain } from 'electron'
import { bkitPath, findbkit } from './bkitClient'
import { get_preferences, set_preferences, save_preferences } from './preferences'
import say from './say'

export default async () => false

ipcMain.on('getbkitPath', (event) => {
  const location = bkitPath()
  say.log('getbkitPath', location)
  event.returnValue = location || findbkit()
})

ipcMain.handle('getStatics', (event) => {
  say.log('getStatics', statics)
  return statics
})

ipcMain.handle('app_version', (event) => {
  return app.getVersion()
})

ipcMain.handle('getPath', (event, name) => {
  return app.getPath(name)
})

/* credentials */
const keytar = require('keytar')

ipcMain.handle('findCredentials', async (event) => {
  say.log('findCredentials')
  try {
    return await keytar.findCredentials('bKit')
  } catch (e) {
    say.error('[findCredentials]', e)
    return []
  }
})

ipcMain.handle('setPassword', async (event, account, password) => {
  try {
    say.log('setPassword', account)
    keytar.setPassword('bKit', account, password)
    return true
  } catch (e) {
    say.error('[setPassword]', e)
    return false
  }
})

ipcMain.handle('getPassword', async (event, account) => {
  try {
    say.log('getPassword', account)
    return await keytar.getPassword('bKit', account)
  } catch (e) {
    say.error('[getPassword]', e)
    return undefined
  }
})

ipcMain.handle('deletePassword', async (event, account) => {
  try {
    say.log('deletePassword', account)
    return await keytar.deletePassword('bKit', account)
  } catch (e) {
    say.error('[deletePassword]', e)
    return undefined
  }
})

/* Preferences */
ipcMain.handle('setPreferences', async (event, prefs) => {
  try {
    // say.log('set_preferences', prefs)
    set_preferences(prefs)
    event.returnValue = true
  } catch (e) {
    say.error('[setPreferences]', e)
    event.returnValue = false
  }
})

ipcMain.handle('getPreferences', async (event) => {
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
