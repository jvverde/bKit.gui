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
    throw new Error `'${location}' doen't exist`
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
    buttons = ['Choose', 'Ignore'],
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
    return checkBkit(location)
  } else if(option === 1) { 
    return null
  } else if (option === 2) {
    runasAdmin()
    load_config()
    return bkitPath()
  } else {
    say.log('Something else')
    return install2AlternateLocation(fullpath, args)
  }
  // If option Admin elevate and the load_config, bkitPath(), and check again
}

// const install = (dst) => {
//   if (checkRights(dst)) {
//     const client = path.join(statics, 'bkit-client')
//     say.log('Sync', client, dst)
//     copySync(client, dst)
//     if (isWin) winInstall(dst)
//     return dst
//   } else {
//     return install2AlternateLocation(dst)
//   }
// }


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

function winInstall (location) {
  if (!isWin) throw new Error 'Not a windows platform'
  if (checkRights(location)) {
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
        return install2AlternateLocation(location, winInstall) // envia mensagem adequda e opção para correr como Admin
      } else {
        return location
      }
    } catch (err) {
      say.error('winInstall errors:', err)
      return install2AlternateLocation(location, winInstall)
    }
  } else {
    return install2AlternateLocation(location, winInstall)    
  }
}


export const setupbkit = async (dst) => {
  say.log('Setup bkit', dst)
  if (isWin && !isAdmin) {
    await runasAdmin()
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


const checkBkit = (location, recheck = false) => {
  if (isbkitok(location)) {
    if (isAdmin && app.commandLine.hasSwitch('elevated')) {
      say.log('The elevated run instance will quit now')
      app.quit()
    } else {
      return bkitPath(location)
    }
  } else if (!recheck) {
    return installBkit(location)
  } else {
    return install2AlternateLocation(location, winInstall)
  }
}

const recheck = (location) => checkBkit(location, true)

const installBkit(location) {
  if (isWin && !process.env.PROD) { // Only need for windows, as we need to run setup.bat
    const client = path.join(app.getAppPath(), 'bkit-client')
    mkdir(client)
    say.log(`Copy from ${location} to ${client}`)
    copySync(location, client)
    const installed = winInstall(client)
    return recheck(installed)
  } else if (isWin) {
    const installed = winInstall(client)
    return recheck(installed)    
  } else {
    return recheck(location)
  }
}

const LIMIT = 100
const findbkitLocation = (dir = app.getAppPath(), cnt = 0) => {
  const base = dir.replace(/[\\\/]resources[\\\/].*$/i, '')
  const location = path.join(base, 'bkit-client')
  say.log('Check bkit at', dir)
  if (isbkitClintInstalled(location)) {
    return bkitPath(location)
  } else if (cnt < LIMIT) {
    const parent = path.dirname(dir)
    if (parent && parent !== dir) return findbkitLocation(parent, ++cnt)
  } else {
    // ASK USER
    return null
  }
}

export const findbkit = () => {
  const location = findbkitLocation()
  return installBkit(location)
}


