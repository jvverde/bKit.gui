import {
  readFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
  accessSync,
  constants
} from 'fs'

import { spawnSync, execSync } from 'child_process'
import { copySync } from 'fs-extra'
import { app, dialog } from 'electron'
import path from 'path'
import Shell from 'node-powershell'
import say from './say'
import Store from 'electron-store'
import runasAdmin from './runas'
import statics from './statics'

const store = new Store({ name: 'config' })

const get_config = () => store.get('config') || {}

let config = get_config()

export const load_config = () => {
  config = get_config() 
}

export const save_config = () => {
  config.lasttime = new Date(Date.now()).toISOString()
  store.set('config', config)
  say.log('Saved config')
}

export const bkitPath = (location) => {
  if (location && existsSync(location)) {
    config.bkit = location
    save_config()
  } else if (location) {
    throw new Error(`'${location}' doen't exist`)
  }
  return config.bkit
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

const checkRights = (dst) => {
  if (!dst) return false
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

const _getList = () => {
  try {
    const depends = path.join(statics, '/depends.lst')
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

export const isbkitok = (location) => isbkitClintInstalled(location) && bkitping(location)

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

const install2AlternateLocation = async (fullpath, args = {}) => {
  const {
    title = "bKit Client isn't installed",
    detail =  'Please choose the location of bKit Client',
    message = `For some reason bKit Client isn't install on ${fullpath}`
  } = args
  const buttons = ['Ignore', 'Choose']
  if (args.admin) buttons.push('Run as Admin')
  const option = dialog.showMessageBoxSync({
    title,
    detail,
    buttons,
    message,
    defaultId: 1,
    cancelId: 0
  })
  if(option === 0) { 
    return Promise.reject('Ignore')
  } else if (option === 1) {
    const location = chosebkitLocation(fullpath)
    return verify(location)
  } else if (option === 2) {
    await runasAdmin()
    load_config()
    return Promise.resolve(bkitPath())
  } else {
    say.log('Something else')
    return install2AlternateLocation(fullpath, args)
  }
}

const makeargs = (title = '', message = '') => {
  const mayElevate = isWin && !isAdmin
  let detail = 'Please select a location where bKit Client is installed'
  if (mayElevate) detail += ', or run as admin' 
  return {
    admin: mayElevate,
    title,
    detail,
    message
  }
}

const errorsRunning = (fullpath) => {
  return makeargs('Error while running setup', `For some unknown reason the setup on  '${fullpath}' run into errors`)
}
const noRights2install = (fullpath) => {
  return makeargs('No write permissions', `The current user have no permissions to write on ${fullpath}`)
}

const winInstall = async (location) => {
  if (!isWin) throw new Error('Not a windows platform')
  say.log('Try to setup bkit client at', location)
  if (checkRights(location)) {
    say.log('Start setup bkit client at', location)
    try {
      const result = spawnSync(
        'CMD',
        ['/C', 'setup.bat'],
        { cwd: location, windowsHide: false }
      )
      say.log('winInstall.stdout', result.stdout.toString())
      say.log('winInstall.stderr', result.stderr.toString())
      if (result.status !== 0) {
        say.warn('The exist status of winstall is not 0', result.status)
        say.warn('winInstall.error', result.error)
      }
      return Promise.resolve(location)
    } catch (err) {
      say.error('winInstall errors:', err)
      return install2AlternateLocation(location, errorsRunning(location))
    }
  } else {
    return install2AlternateLocation(location, noRights2install(location))    
  }
}

const notInstalled = (fullpath) => {
  return makeargs('It was impossible to install', `For some reason bkit client isn't correctly intalled on ${fullpath}`)
}

const recheck = async (location) => {
  say.log('Recheck bkit client at', location)
  if (isbkitok(location)) {
    if (isAdmin && app.commandLine.hasSwitch('elevated')) {
      say.log('The elevated run instance will quit now')
      app.quit()
    } else {
      return Promise.resolve(bkitPath(location))
    }
  } else {
    return install2AlternateLocation(location, notInstalled(location))
  }
}

const installBkit = async (location) => {
  say.log('Install bkit client at', location)
  if (isWin && !process.env.PROD) { // Only need for windows, as we need to run setup.bat
    const client = path.join(app.getAppPath(), 'bkit-client')
    say.log('Copy bkit to development area', client)
    if (client !== location) {
      mkdir(client)
      say.log(`Copy from ${location} to ${client}`)
      copySync(location, client)
    }
    const installed = await winInstall(client)
    return recheck(installed)
  } else if (isWin) {
    const installed = await winInstall(client)
    return recheck(installed)    
  } else {
    return recheck(location)
  }
}

const invalidLocation = (fullpath) => {
  return makeargs('Invalid Location',`'${fullpath}' is an invalid location`)
}

const verify = async (location) => {
  say.log('Verify bkit client at', location)
  if (location && isbkitok(location)) {
    return Promise.resolve(location)
  } else if(location && existsSync(location)) {
    return installBkit(location)
  } else {
    return install2AlternateLocation(location  || app.getAppPath(), invalidLocation(location))
  }  
}

const LIMIT = 100
const findbkitLocation = (dir = app.getAppPath(), cnt = 0) => {
  const base = dir.replace(/[\\\/]resources[\\\/].*$/i, '')
  const location = path.join(base, 'bkit-client')
  say.log('Search for bkit client at', dir)
  if (isbkitClintInstalled(location)) { 
    return bkitPath(location)
  } else if (cnt < LIMIT) {
    const parent = path.dirname(dir)
    if (parent && parent !== dir) return findbkitLocation(parent, ++cnt)
  }
  return null
}

export const findbkit = async () => {
  const location = findbkitLocation()
  return verify(location)
}


