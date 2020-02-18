import { app, BrowserWindow, nativeTheme, ipcMain, dialog, Menu } from 'electron'
const log = require('electron-log')
const { autoUpdater } = require("electron-updater")

autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'info'
log.info('App starting...')

try {
  if (process.platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(require('path').join(app.getPath('userData'), 'DevTools Extensions'))
  }
} catch (_) { }

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = require('path').join(__dirname, 'statics').replace(/\\/g, '\\\\')
}

let mainWindow

console.log('Electron Init')
function createWindow () {
  /**
   * Initial window options
   */

  const windowStateKeeper = require('electron-window-state')
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  })

  mainWindow = new BrowserWindow({
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

  mainWindow.loadURL(process.env.APP_URL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
  mainWindowState.manage(mainWindow)
  console.log('createWindow')
}
// from https://www.tutorialspoint.com/electron/electron_menus.htm
const template = [
  {
    role: 'fileMenu'
  },{
    label: 'Edit',
    submenu: [{
        role: 'undo'
      },{
        role: 'redo'
      },{
        type: 'separator'
      },{
        role: 'cut'
      },{
        role: 'copy'
      },{
        role: 'paste'
      },{
        type: 'separator'
      }]
  },{
    label: 'View',
    submenu: [{
        role: 'reload'
      },{
        role: 'forceReload'
      },{
        role: 'toggledevtools'
      },{
        type: 'separator'
      },{
        role: 'resetzoom'
      },{
        role: 'zoomin'
      },{
        role: 'zoomout'
      },{
        type: 'separator'
      },{
        role: 'togglefullscreen'
      }]
  },{
    role: 'window',
    submenu: [{
        role: 'minimize'
      },{
        role: 'close'
      }]
  } /*,{
    role: 'help',
    submenu: [{
        label: 'Learn More'
       }]
  }*/
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
// ------------------------------

app.on('ready', () => {
  const fs = require('fs')

  if(!config.bkit || !fs.existsSync(config.bkit)) {
    const bkitdir = dialog.showOpenDialogSync({
      title: 'Where is bkit Client?',
      multiSelections: false,
      buttonLabel: 'This is the bKit directory',
      properties: ['openDirectory']
    })
    console.log('bkitdir=', bkitdir)
    if (bkitdir) config.bkit = bkitdir[0]
  }

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  console.log('on activate')
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('debug', (event, arg) => {
  mainWindow.webContents.openDevTools()
  console.log('on debug')
})

const Store = require('electron-store')
const store = new Store({ name: 'config' })
const config = store.get('config') || {}

if (app.commandLine.hasSwitch('bkit')) {
  config.bkit = app.commandLine.getSwitchValue('bkit')
}

ipcMain.on('getbKitPath', (event) => {
  console.log('getbKitPath')
  event.returnValue = config.bkit
})
ipcMain.on('app_version', (event) => {
  event.returnValue = app.getVersion()
})
// Workaround to close all processes / sub-processes after closing the app
// https://stackoverflow.com/questions/42141191/electron-and-node-on-windows-kill-a-spawned-process
app.once('window-all-closed', app.quit)

app.once('before-quit', () => {
  config.lasttime = new Date(Date.now()).toISOString()
  store.set('config', config)
  
  // Workaround to close all processes / sub-processes after closing the app
  // https://stackoverflow.com/questions/42141191/electron-and-node-on-windows-kill-a-spawned-process
  window.removeAllListeners('close')
})
