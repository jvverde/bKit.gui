import {
  app,
  BrowserWindow,
  nativeTheme,
  ipcMain,
  session
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
import { createRootCaVerifier } from 'electron-root-ssl-pinning'

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
      webSecurity: false,
      enableRemoteModule: true

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
    try {
      const location = await findbkit(client)
      say.log('Found bkit client at', location)
      bkitPath(location)
      load_config()
    } catch (err) {
      say.warn('bKit client not found')
    }
  }
  createWindow()
  check4updates()
  session.defaultSession.setCertificateVerifyProc(async (request, callback) => {
    /* The verifier returns a verification status code
     * `0` - VALID
     * `-2` - INVALID
     * `-3` - INTERNAL_ERROR
     */
    console.log('verifier', request)
    const result = await verifier(request)
    console.log('verify result', result)
    callback(0)
    if (result === 0) {
      /* https://electronjs.org/docs/api/session#sessetcertificateverifyprocproc
       * `0` - Indicates success and disables Certificate Transparency verification.
       * `-2` - Indicates failure.
       * `-3` - Uses the verification result from chromium.
       */
      callback(0)
    } else {
      // recommend to call `-2` always when the verifier result is not `0`
      callback(-2)  }
  })
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

app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

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

const keytar = require('keytar')

ipcMain.on('findCredentials', async (event) => {
  say.log('findCredentials')
  const credentials = await keytar.findCredentials('bKit')
  event.returnValue = credentials
})

ipcMain.on('setPassword', async (event, account, password) => {
  say.log('setPassword', account)
  keytar.setPassword('bKit', account, password)
  event.returnValue = true
})

ipcMain.on('getPassword', async (event, account) => {
  say.log('getPassword', account)
  const pass = await keytar.getPassword('bKit', account)
  event.returnValue = pass
})

ipcMain.on('deletePassword', async (event, account) => {
  say.log('deletePassword', account)
  const result = await keytar.deletePassword('bKit', account)
  event.returnValue = result
})

menu()


const verifier = createRootCaVerifier([
  `-----BEGIN CERTIFICATE-----
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
IF40NqlxDoMMM1w=
-----END CERTIFICATE-----`
]);


say.log('bkit started')
