import { BrowserWindow } from 'electron'

import say from './say'
import windowStateKeeper from 'electron-window-state'
import statics from './statics'
import { resolve } from 'path'


export default () => {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  })

  const mainWindow = new BrowserWindow({
    // backgroundColor: '#2e2c29',
    width: mainWindowState.width,
    height: mainWindowState.height,
    x: mainWindowState.x,
    y: mainWindowState.y,
    // useContentSize: true,
    // icon: resolve(statics, 'bkit-icons/bkit-128x128.png'),
    icon: resolve('', 'bkit-icons/bkit-128x128.png'),
    webPreferences: {
      // Change from /quasar.conf.js > electron > nodeIntegration;
      // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
      nodeIntegration: process.env.QUASAR_NODE_INTEGRATION,
      contextIsolation: false,
      webSecurity: false,
      enableRemoteModule: true

      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      // preload: path.resolve(__dirname, 'electron-preload.js')
    }
  })

  // const splash = new BrowserWindow({width: 810, height: 610, transparent: true, frame: false, alwaysOnTop: true});
  // splash.loadURL(`file://${__dirname}/splash.html`);

  mainWindow.loadURL(process.env.APP_URL)

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
