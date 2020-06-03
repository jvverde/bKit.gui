import path from 'path'
import { readFileSync, readdirSync, existsSync, mkdirSync, accessSync, constants } from 'fs'
import { spawnSync } from 'child_process'

import { app, dialog } from 'electron'

const mkdir = (path) => { return mkdirSync(path, { recursive: true }) }
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

const isEmpty = (path) => { return readdirSync(path).length === 0 }

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

const askUser = async (fullpath, args = {}) => {
  const {
    detail =  isWin ? 'Please choose a another location or give Admin rights' : 'Please choose a another location',
    buttons = isWin ? ['Choose another location', 'Admin rights'] : ['Choose another location'],
    message = `However, you don't have rights to install it on ${fullpath}`
  } = args
  const option = dialog.showMessageBoxSync({
    title: "bKit client isn't installed yet",
    detail,
    buttons,
    message,
    defaultId: 0,
    cancelId: 0
  })
  if (option === 1 && elevate()) {
    console.log('quit')
    app.quit()
    return null
  } else {
    const location = chosebkitLocation(fullpath)
    if (location) {
      installbKit()
    }
  }
} 

const installbKit = async (location, force = false) => {
  const git = require('simple-git/promise')(location)
  git.addConfig('core.autocrlf', false)
  if (isEmpty(location)) {
    await git.clone('https://github.com/jvverde/bKit.git', location, ['--depth', 1])
  } else {
    const isrepo = await git.checkIsRepo()
    if (isrepo) {
      try {
        const remotes = await git.getRemotes(true )
        console.log('remotes', remotes)
        if (force) await git.pull()
        if (!isBkitClintInstalled(location)) {
          await git.reset(['--hard'])
        }
      } catch(err) {
        console.warn("Wasn't possible to pull/reset repository to %s", location )
      }
    } else {
      const newlocation = await askUser(location, {
        message: "The chosen location isn't empty or is not a git repository",
        detail: 'Please choose a another location',
        buttons: ['Choose another location']
      })
      location = await setupbkit(newlocation)
    }
  }
  // if (location && existsSync(bKitPath) && )
  return location
}

export const setupbkit = async (dst) => {
  const parent = path.dirname(dst)
  if (!existsSync(dst)) {
    try {
      console.log('Test access to %s', parent)
      accessSync(parent, constants.W_OK)
      console.log('Yes, I can write on %s', parent)
      mkdir(dst)
      return await installbKit(dst)
    } catch (err) {
      return await askUser(dst)
    }
  } else {
    return await installbKit(dst)
  }
}

const _getList = () => {
  try {
    const depends = path.join(__statics, '/depends.lst')
    const result = readFileSync(depends, 'utf8')
    return result.split(/\r*\n+/).filter(e => e.match(/\.sh$/))
  } catch (err) {
    console.error('Catch _getList:', err)
  }
}

const list = _getList() || []
console.log('list', list)

export const isBkitClintInstalled = (bKitPath) => {
  return bKitPath && existsSync(bKitPath) && list.every(e => {
    const fullpath = path.join(bKitPath, e)
    return existsSync(fullpath)
  })
}
