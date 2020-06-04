import { app, BrowserWindow, nativeTheme, ipcMain, dialog, Menu, Notification } from 'electron'
import { bkitPath, setupbkit, isbkitClintInstalled, isbkitok, save_config } from './bkitClient'

const log = require('electron-log')
const { autoUpdater } = require("electron-updater")
const path = require('path')
const fs = require('fs')


autoUpdater.logger = log
autoUpdater.allowDowngrade = true
autoUpdater.autoInstallOnAppQuit = false
autoUpdater.autoDownload = false
autoUpdater.logger.transports.file.level = 'info'
autoUpdater.on('error', (err) => {
  log.error(err)
})

const say = {
  log: (...args) => {
    console.log(...args)
    log.info(...args)
  },
  warn: (...args) => {
    console.warn(...args)
    log.warn(...args)
  },
  error: (...args) => {
    console.error(...args)
    log.error(...args)
  }
}

say.log('bkit starting...')
say.log('Elevated', app.commandLine.hasSwitch('elevated'))

try {
  if (process.platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(path.join(app.getPath('userData'), 'DevTools Extensions'))
  }
} catch (_) { }

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = path.join(__dirname, 'statics').replace(/\\/g, '\\\\')
}

let mainWindow

function createWindow () {

  const windowStateKeeper = require('electron-window-state')
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

function check4updates () {
  autoUpdater.on('update-available', (info) => {
    sendStatusToWindow(info)
    say.log(info)
    if (Notification.isSupported()) {
      const notify = new Notification({
        title: 'Updated version',
        body: `A new version ${info.version} is available`
      })
      notify.show()
    }
  })
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.autoDownload = false
  say.log(`Check for updates...`)
  autoUpdater.checkForUpdatesAndNotify()
}

function getUpdates(channel = 'latest') {
  autoUpdater.channel = channel
  autoUpdater.on('update-not-available', (info) => {
    dialog.showMessageBox({
      title: 'No Updates',
      message: 'Current version is up-to-date.'
    })
  })
  autoUpdater.on('update-downloaded', (info) => {
    setImmediate(() => autoUpdater.quitAndInstall())
  })
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.autoDownload = true
  say.log(`Check and get updates on channel ${channel}`)
  return autoUpdater.checkForUpdates()
}

// from https://www.tutorialspoint.com/electron/electron_menus.htm
const template = [
  {
    role: 'fileMenu',
    submenu: [
      {
        label: 'Upgrade GUI',
        submenu: [
          {
            label: 'Beta',
            click: async () => {
              await getUpdates('beta')
            }
          },{
            label: 'Stable',
            click: async () => {
              await getUpdates('latest')
            }
          }
        ]
      },
      {
        role: 'quit'
      }
    ]
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

const defaultbkitClientPath = () => {
  const current = path.join(app.getAppPath()).replace(/[\\\/]bkit[\\\/]resources[\\\/].*/i, '')
  return path.normalize(path.join(current, 'bkit-client'))  
}

const newbkitPath = (dst = defaultbkitClientPath()) => {
  say.log('newbkitPath', dst)
  return setupbkit(dst)
}

app.on('ready', async () => {
  const client = bkitPath()
  say.log('App is ready', client)
  if(!client || !fs.existsSync(client) || !isbkitok(client)) {
    await newbkitPath(client)
    // await newbkitPath('C:\\Program Files\\bkit-client\\a\\b\\c')
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
  event.returnValue = location || newbkitPath()
})

ipcMain.on('getStatics', (event) => {
  say.log('getStatics', __statics)
  event.returnValue = __statics
})

ipcMain.on('app_version', (event) => {
  event.returnValue = app.getVersion()
})

ipcMain.on('getPath', (event, name) => {
  event.returnValue = app.getPath(name)
})

// Auto updater section

function sendStatusToWindow(text) {
  say.log(text)
  mainWindow.webContents.send('message', text)
}

say.log('bkit started')

