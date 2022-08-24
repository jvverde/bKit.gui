// let wsList = {}
'use strict'
let [BASH, TERM] = ['bash', 'xterm']
import { spawn } from 'child_process'
import { ipcMain } from 'electron'
import { bkitPath } from '../bkitClient'
import say from '../utils/say'

if (process.platform === 'win32') {
  BASH = 'bash.bat'
  TERM = BASH // for windows user bash as a terminal
}

ipcMain.handle('openShell', () => {
  try {
    console.log('process', process)
    console.log('process.platform', process.platform)
    const bKitPath = bkitPath()
    const fd = spawn(
      TERM,
      [],
      { cwd: bKitPath, windowsHide: false, detached: true, stdio: 'ignore' }
    )
    fd.unref()
  } catch (e) {
    say.error(e)
    return false
  } 
})

export default {}