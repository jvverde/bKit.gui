import { BrowserWindow, app } from 'electron'
import { join, resolve } from 'path'

import say from './utils/say'
import windowStateKeeper from 'electron-window-state'

const icon = join(app.getAppPath(), 'statics', 'bkit-client', 'bkit-128x128.png')

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
  console.log('__dirname', __dirname)
  console.log('process.env.APP_URL', process.env.APP_URL)
  console.log('preload', resolve(__dirname, 'electron-preload.js'))
  mainWindow.loadURL(process.env.APP_URL)

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools()
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools()
    })
  }
  // const session = mainWindow.webContents.session 
  // setVerifyProc({ session })
  
  mainWindow.on('closed', () => {
    say.log('mainWindow closed')
    // mainWindow = null
  })
  mainWindow.on('beforeunload ', () => {
    say.log('beforeunload')
  })
  mainWindow.onbeforeunload = e => {
    say.log('onbeforeunload')    
  }
  mainWindow.on('close', event => {
    say.log('mainWindow is going to close')
  })
  mainWindow.webContents.on('destroyed', () => {
    say.log('webContents Was destroyed')
  })

  mainWindowState.manage(mainWindow)
  return mainWindow
}
