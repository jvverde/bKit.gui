// SEE this when possible
// https://stackoverflow.com/questions/44391448/electron-require-is-not-defined

import { ipcMain, dialog, app } from 'electron'
import say from '../utils/say'

export default async () => false

ipcMain.handle('askUser4Location2recovery', async () => {
  try { 
    const download = app.getPath('downloads') || app.getPath('temp')
    const result = await dialog.showOpenDialog({
      title: 'Where do you want to recover your data',
      defaultPath: download,
      buttonLabel: 'Recover to here',
      properties: ['openDirectory', 'promptToCreate']
    })
    return result && result.filePaths instanceof Array ? result.filePaths[0] : undefined
  } catch (err) {
    say.error('Catch on showOpenDialog', err)
    return undefined
  }
})
