// SEE this when possible
// https://stackoverflow.com/questions/44391448/electron-require-is-not-defined

import {
  app,
  nativeTheme,
  dialog,
  ipcMain
} from 'electron'

import menu from './menu'

import {
  bkitPath,
  isbkitClintInstalled,
  isbkitok,
  findbkit,
  save_config,
  load_config
} from './bkitClient'

import { check4updates, getUpdates } from './auto-update'
import say from './utils/say'
import path from 'path'
import fs from 'fs'
import { autoUpdater } from 'electron-updater'
import windowStateKeeper from 'electron-window-state'

// import setTray from './tray'
import createWindow from './createWindow'

import setVerifyProc from './cert/setVerifyProc'

say.log('bkit starting...')
say.log('is Elevated:', app.commandLine.hasSwitch('elevated'))

try {
  if (process.platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    fs.unlinkSync(path.join(app.getPath('userData'), 'DevTools Extensions'))
  }
} catch (_) { }

const root = {
  tray: null,
  mainWindow: null
} // prevent gc to keep tray. Idea from https://stackoverflow.com/a/64204975

app.on('ready', async () => {
  try {
    say.log('App is ready')
    load_config()
    const client = bkitPath()
    say.log('Check if client is run at', client)
    if(!client || !fs.existsSync(client) || !isbkitok(client)) {
      try {
        const location = await findbkit(client) //
        say.log('Found bkit client at', location)
        bkitPath(location)
        load_config()
      } catch (err) {
        say.warn('bKit client not found')
      }
    }
    root.mainWindow = createWindow()
    // root.tray = setTray(root)

    const session = root.mainWindow.webContents.session 
    setVerifyProc({ session })

    check4updates()
  } catch (e) {
    say.error('On App Ready error', e)
    dialog.showMessageBox({
      title: 'Error on start window',
      buttons: ['Dismiss'],
      type: 'warning',
      message: `${e}`
    })
  }
  
})

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // https://www.electronjs.org/docs/api/app#event-certificate-error
  // console.log('certificate-error', certificate)
  if (url.match(/https:\/\/(10|192\.168|172\.(1[6-9]|2|3[0-2]))\./)) {
    say.warn(`Certifiate error, but it will be ignored as it come from a private address ${url}`)
    event.preventDefault()
    callback(true)
  } else {
    callback(false)
  }
})

app.on('window-all-closed', event => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (root.mainWindow === null) {
    root.mainWindow = createWindow()
  }
})

app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

// Workaround to close all processes / sub-processes after closing the app
// https://stackoverflow.com/questions/42141191/electron-and-node-on-windows-kill-a-spawned-process
app.once('window-all-closed', () => {
  say.log('window-all-closed')
  app.quit()
})

app.on('before-quit', () => {
  say.log('Before quit')
  save_config()
})

app.once('before-quit', () => {
  say.log('I do it once Before quit')
  // Workaround to close all processes / sub-processes after closing the app
  // https://stackoverflow.com/questions/42141191/electron-and-node-on-windows-kill-a-spawned-process
  window.removeAllListeners('close')
})

ipcMain.on('debug', (event, arg) => {
  if (arg === 'on'){
    root.mainWindow.webContents.openDevTools()
  } else {
    root.mainWindow.webContents.closeDevTools()
  }
})

menu()

say.log('bkit started')

import helpers from './handlers/'