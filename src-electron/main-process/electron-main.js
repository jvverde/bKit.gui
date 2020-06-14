import {
  app,
  BrowserWindow,
  nativeTheme,
  ipcMain
} from 'electron'

import menu from './menu'

import {
  bkitPath,
  setupbkit,
  isbkitClintInstalled,
  isbkitok,
  findbkit,
  save_config,
  load_config
} from './bkitClient'

import { check4updates, getUpdates } from './auto-update'
import say from './say'
import path from 'path'
import fs from 'fs'
import { autoUpdater } from 'electron-updater'
import windowStateKeeper from 'electron-window-state'
import statics from './statics'

say.log('bkit starting...')
say.log('is Elevated:', app.commandLine.hasSwitch('elevated'))

try {
  if (process.platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    fs.unlinkSync(path.join(app.getPath('userData'), 'DevTools Extensions'))
  }
} catch (_) { }

let mainWindow

function createWindow () {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  })

  mainWindow = new BrowserWindow({
    // backgroundColor: '#2e2c29',
    width: mainWindowState.width,
    height: mainWindowState.height,
    x: mainWindowState.x,
    y: mainWindowState.y,
    // useContentSize: true,
    webPreferences: {
      // Change from /quasar.conf.js > electron > nodeIntegration;
      // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
      nodeIntegration: QUASAR_NODE_INTEGRATION,

      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      // preload: path.resolve(__dirname, 'electron-preload.js')
    }
  })

  // const splash = new BrowserWindow({width: 810, height: 610, transparent: true, frame: false, alwaysOnTop: true});
  // splash.loadURL(`file://${__dirname}/splash.html`);

  mainWindow.loadURL(process.env.APP_URL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindowState.manage(mainWindow)
}

app.on('ready', async () => {
  say.log('App is ready')
  load_config()
  const client = bkitPath()
  say.log('Check if client is run at', client)
  if(!client || !fs.existsSync(client) || !isbkitok(client)) {
    const location = findbkit(client)
    say.log('Found bkit-script at', location)
    bkitPath(location)
    load_config()
  }
  createWindow()
  check4updates()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('debug', (event, arg) => {
  if (arg === 'on'){
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.webContents.closeDevTools()
  } 
})

// Workaround to close all processes / sub-processes after closing the app
// https://stackoverflow.com/questions/42141191/electron-and-node-on-windows-kill-a-spawned-process
app.once('window-all-closed', app.quit)

app.once('before-quit', () => {
  save_config()  
  // Workaround to close all processes / sub-processes after closing the app
  // https://stackoverflow.com/questions/42141191/electron-and-node-on-windows-kill-a-spawned-process
  window.removeAllListeners('close')
})

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

menu()

say.log('bkit started')
