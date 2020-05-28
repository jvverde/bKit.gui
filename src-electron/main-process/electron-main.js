import { app, BrowserWindow, nativeTheme, ipcMain, dialog, Menu, Notification } from 'electron'
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
  log.erro(err)
})

log.info('Bkit starting...')

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
    log.info(info)
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
  log.info(`Check for updates...`)
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
  log.info(`Check and get updates on channel ${channel}`)
  return autoUpdater.checkForUpdates()
}

function gitpull() {
  const git = require('simple-git')(config.bkit)
  git.pull('public', 'master', (...args) => {
    console.log(...args)
  })
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
        label: 'Upgrade bKit Client',
        click: () => gitpull() 
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
const mkdir = (path) => { return fs.mkdirSync(path, { recursive: true }) }
const execSync = require('child_process').execSync 

const isWin = process.platform === 'win32'

const isAdmin = () => {
  try{
    console.log('Check admin rights')
    execSync('NET SESSION') 
    return true
  } catch (err) {
    return false
  } 
}

const elevate = () => {
  if (isWin) {
    if (isAdmin()) {
      console.log('I am already run as admin')
      return false
    } else {
      const executeSync = require('elevator').executeSync
      console.log('Elevate', process.argv)
      executeSync(process.argv, {
        waitForTermination: true
      })
      return true
    }
  } else {
    return false
  }
}

const chosebkitLocation = (path) => {
  const result = dialog.showOpenDialogSync({
    title: 'Select a location for bKit client',
    defaultPath: path,
    buttonLabel: 'Choose',
    // properties: ['openDirectory', 'promptToCreate']
    properties: ['openDirectory']
  })
  console.log('result', result)
  if (result && result instanceof Array) return result[0]
  else return null
}

const askUser = (fullpath) => {
  const detail =  isWin ? 'Please choose a another directory or give Admin rights' : 'Please choose a another directory'
  const buttons = isWin ? ['Choose another location', 'Admin rights'] : ['Choose another location']
  const option = dialog.showMessageBoxSync({
    title: "bKit client isn't installed yet",
    message: `However, you don't have rights to install it on ${fullpath}`,
    detail,
    buttons,
    defaultId: 0,
    cancelId: 0
  })
  if (option === 1 && elevate()) {
    console.log('quit')
    app.quit()
    return null
  } else {
    return chosebkitLocation(fullpath)
  }
} 

const Store = require('electron-store')
const store = new Store({ name: 'config' })
const config = store.get('config') || {}

if (app.commandLine.hasSwitch('bkit')) {
  config.bkit = app.commandLine.getSwitchValue('bkit')
}

const defaultbKitClientPath = () => {
  const current = path.join(app.getAppPath()).replace(/[\\\/]bKit[\\\/]resources[\\\/].*/i, '')
  return path.normalize(path.join(current, 'bkit-client'))  
}

const newbKitPath = (dst = defaultbKitClientPath()) => {
  const parent = path.dirname(dst)
  if (!fs.existsSync(dst)) {
    try {
      console.log('Test access to %s', parent)
      fs.accessSync(parent, fs.constants.W_OK)
      console.log('Yes, I can write on %s', parent)
      mkdir(dst)
      config.bkit = dst
    } catch (err) {
      config.bkit = askUser(dst)
    }
  } else {
    config.bkit = dst
  }
  store.set('config', config)
  return config.bkit
}

app.on('ready', () => {
  console.log('App is ready')
  if(!config.bkit || !fs.existsSync(config.bkit)) {
    newbKitPath()
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
  config.lasttime = new Date(Date.now()).toISOString()
  store.set('config', config)
  
  // Workaround to close all processes / sub-processes after closing the app
  // https://stackoverflow.com/questions/42141191/electron-and-node-on-windows-kill-a-spawned-process
  window.removeAllListeners('close')
})

ipcMain.on('getbKitPath', (event) => {
  console.log('getbKitPath', config.bkit)
  event.returnValue = config.bkit || newbKitPath()
})

ipcMain.on('setbKitPath', (event, path) => {
  console.log('setbKitPath', path)
  config.bkit = path
  store.set('config', config)
  event.returnValue = true
})

ipcMain.on('getStatics', (event) => {
  console.log('__statics', __statics)
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
  log.info(text)
  mainWindow.webContents.send('message', text)
}

