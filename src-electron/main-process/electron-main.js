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
import { pki } from 'node-forge'

import rootCA from './cert/ca'

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

  try {
    // console.log('rootCA', rootCA)
    const caStore = pki.createCaStore(rootCA)
    mainWindow.webContents.session.setCertificateVerifyProc(async (request, callback) => {
      // https://www.electronjs.org/docs/api/session
      // console.log('setCertificateVerifyProc', request)
      try {
        const certdata = request.certificate.data
        // console.log('certdata', certdata)
        const cert = pki.certificateFromPem(certdata)
        // console.log('cert', cert)
        if (pki.verifyCertificateChain(caStore, [ cert ])) {
          say.log('Certicate verified!')
          callback(0)
        } else {
          say.error('Failed due to some unknown reason', e.message || e)
          callback(-3)
        }
      } catch (e) {
        say.error('Failed to verify certificate', e.message || e)
        callback(-3)
      }
      return
    })
  } catch (e) {
    say.error('Failed to verify certificate', e.message || e)
  }

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

say.log('bkit started')
