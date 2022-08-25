// SEE this when possible
// https://stackoverflow.com/questions/44391448/electron-require-is-not-defined

import { ipcMain } from 'electron'
import say from '../utils/say'
import keytar from 'keytar'

ipcMain.handle('findCredentials', async () => {
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

export default false
