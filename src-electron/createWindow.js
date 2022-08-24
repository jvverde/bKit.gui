import { BrowserWindow, app, ipcMain } from 'electron'
import { join, resolve } from 'path'

import say from './utils/say'
import windowStateKeeper from 'electron-window-state'

const icon = join(app.getAppPath(), 'statics', 'bkit-client', 'bkit-128x128.png')

say.log('__dirname', __dirname)
say.log('process.env.APP_URL', process.env.APP_URL)
say.log('preload', resolve(__dirname, 'electron-preload.js'))

export default () => {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  })

  const mainWindow = new BrowserWindow({
    width: mainWindowState.width,
    height: mainWindowState.height,
    x: mainWindowState.x,
    y: mainWindowState.y,
    icon,
    webPreferences: {
      nodeIntegration: false, // process.env.QUASAR_NODE_INTEGRATION,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: resolve(__dirname, 'electron-preload.js')
    }
  })

  // const splash = new BrowserWindow({width: 810, height: 610, transparent: true, frame: false, alwaysOnTop: true});
  // splash.loadURL(`file://${__dirname}/splash.html`);

  mainWindow.loadURL(process.env.APP_URL)

  // if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
  mainWindow.webContents.openDevTools()
  // } else {
  //   // we're on production; no access to devtools pls
  //   mainWindow.webContents.on('devtools-opened', () => {
  //     mainWindow.webContents.closeDevTools()
  //   })
  // }
  // const session = mainWindow.webContents.session 
  // setVerifyProc({ session })
  
  mainWindow.on('closed', () => {
    say.log('mainWindow closed')
    // mainWindow = null
  })
  mainWindow.on('beforeunload ', () => {
    say.log('beforeunload')
  })
  mainWindow.onbeforeunload = () => {
    say.log('onbeforeunload')    
  }
  mainWindow.on('close', () => {
    say.log('mainWindow is going to close')
  })
  mainWindow.webContents.on('destroyed', () => {
    say.log('webContents Was destroyed')
  })

  mainWindowState.manage(mainWindow)
 
  ipcMain.on('switchdebug', () => {
    mainWindow.webContents.toggleDevTools()
  })

  return mainWindow
}

