import path from 'path'
import { readFileSync, readdirSync, existsSync, mkdirSync, accessSync, constants } from 'fs'
import { spawnSync, execSync } from 'child_process'
import { copySync } from 'fs-extra'

import { app, dialog } from 'electron'

const Store = require('electron-store')
const store = new Store({ name: 'config' })
const get_config = () => store.get('config') || {}

let config = get_config()

export const load_config = () => {
  config = get_config() 
}

export const save_config = () => {
  config.lasttime = new Date(Date.now()).toISOString()
  store.set('config', config)
}

export const bkitPath = () => config.bkit

const log = require('electron-log')

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

if (process.env.PROD) {
  global.__statics = path.join(__dirname, 'statics').replace(/\\/g, '\\\\')
}

const mkdir = (path) => { return mkdirSync(path, { recursive: true }) }

const isWin = process.platform === 'win32'

const isAdmin = isWin && (() => {
  try{
    say.log('Check admin rights')
    execSync('NET SESSION') 
    return true
  } catch (err) {
    return false
  } 
})()

const isEmpty = (path) => readdirSync(path).length === 0

const elevate = () => {
  if (isWin && isAdmin) {
    throw new Error('I am already run as admin')
  } else if (isWin) {
    const executeSync = require('elevator').executeSync
    const args = process.argv.concat(['--elevated'])
    say.log('Elevate', args)
    executeSync(args, {
      waitForTermination: true
    }, function(error, stdout, stderr) {
      if (error) throw error
      say.log('executeSync stdout', stdout)
      say.log('executeSync stderr', stderr)
    })
  } else {
    throw new Error('I am supposed to be called only in a windows platform')
  }
}

const runasAdmin = () => {
  say.log('Run as Administrator')
  elevate()
  say.log('Continue run as normal user')
}

const chosebkitLocation = (path) => {
  const result = dialog.showOpenDialogSync({
    title: 'Select a location for bkit client',
    defaultPath: path,
    buttonLabel: 'Choose',
    properties: ['openDirectory']
  })
  say.log('result', result)
  if (result && result instanceof Array) return result[0]
  else return null
}

const install2AlternateLocation = (fullpath, args = {}) => {
  const {
    title = "bkit client isn't installed yet",
    detail =  'Please choose a location for install it',
    buttons = ['Choose'],
    message = fullpath ? `For some unknown reason you can't install on ${fullpath}` : ''
  } = args
  const option = dialog.showMessageBoxSync({
    title,
    detail,
    buttons,
    message,
    defaultId: 0,
    cancelId: 0
  })
  if (option === 0) {
    const location = chosebkitLocation(fullpath)
    if (location) {
      return install(location)
    } else {
      return install2AlternateLocation(fullpath, args)
    }
  } else if (option > 0) {
    return option
  } else {
    say.log('Something else')
    return install2AlternateLocation(fullpath, args)
  }
}

const checkRights = (dst) => {
  try {
    if (!existsSync(dst)) mkdir(dst)
    say.log('Test write access to', dst)
    accessSync(dst, constants.W_OK)
    say.log('Yes, I can write on', dst)
    return true
  } catch (err) {
    return false
  }
} 

const install = (dst) => {
  if (checkRights(dst)) {
    const client = path.join(__statics, 'bkit-client')
    say.log('Sync', client, dst)
    copySync(client, dst)
    if (isWin) winInstall(dst)
    return dst
  } else {
    return install2AlternateLocation(dst)
  }
}

export const setupbkit = (dst) => {
  say.log('Setup bkit', dst)
  if (isWin && !isAdmin) {
    runasAdmin()
    // say.log('Go to relaunch')
    // app.relaunch()
    // app.exit(0)
    load_config()
    return bkitPath()
  } else {
    const location = install(dst)
    say.log('Installation done to', location)

    config.bkit = location
    say.log('save bkit client location', config.bkit)
    save_config()

    if (isAdmin && app.commandLine.hasSwitch('elevated')) {
      say.log('The elevated run instance will quit now')
      app.quit()
    } else {
      return location
    }      
  }
}

const _getList = () => {
  try {
    const depends = path.join(__statics, '/depends.lst')
    const result = readFileSync(depends, 'utf8')
    return result.split(/\r*\n+/).filter(e => e.match(/\.sh$/))
  } catch (err) {
    say.error('Catch _getList:', err)
  }
}

const list = _getList() || []

export const isbkitClintInstalled = (location) => {
  return location && existsSync(location) && list.every(e => {
    const fullpath = path.join(location, e)
    return existsSync(fullpath)
  })
}

const BASH = isWin ? 'bash.bat' : 'bash'

function bkitping (location) {
  try {
    say.log('bkitping on', location)
    const msg = 'aqui'
    const result = spawnSync(BASH, ['./bash.sh', 'echo', msg], { cwd: location, windowsHide: true })
    return result.stdout.toString().replace(/(\r|\n|\s)*$/, '') === msg
  } catch (err) {
    say.warn('bkitping fail:', err)
    return false
  }
}

const impossible2install = {
  title: 'Impossible to install',
  message: "Errors while instaling on given location",
  detail: 'Please choose a another location'
}

function winInstall (location) {
  if (!isWin) return
  try {
    const result = spawnSync(
      'CMD',
      ['/C', 'setup.bat'],
      { cwd: location, windowsHide: false }
    )
    say.log('winInstall.stdout', result.stdout.toString())
    say.log('winInstall.stderr', result.stderr.toString())
    say.log('winInstall.status', result.status)
    say.log('winInstall.error', result.error)
    if (result.status !== 0) {
      install2AlternateLocation(location, winInstall)
    }
  } catch (err) {
    say.error('winInstall errors:', err)
  }
}

export const isbkitok = (location) => isbkitClintInstalled(location) && bkitping(location)
