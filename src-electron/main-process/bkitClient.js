import path from 'path'
import { readFileSync, readdirSync, existsSync, mkdirSync, accessSync, constants } from 'fs'
import { spawnSync, execSync } from 'child_process'

import { app, dialog } from 'electron'

const BKIT = 'https://github.com/jvverde/bKit.git'

const mkdir = (path) => { return mkdirSync(path, { recursive: true }) }

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
      console.error('I am already run as admin')
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

const runasAdmin = () => {
  console.log('Run as Administrator')
  elevate()
  app.quit()
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

const install2AlternateLocation = async (fullpath, args = {}) => {
  const {
    title = "bKit client isn't installed yet",
    detail =  'Please choose a another location',
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
      return await installbKit()
    } else {
      return await install2AlternateLocation(fullpath, args)
    }
  } else if (option > 0) {
    return option
  } else {
    console.log('Something else')
    return await install2AlternateLocation(fullpath, args)
  }
}

const notbkitrepo = {
  title: 'Not a bkit Client Repo',
  message: "The chosen location isn't a valid repository for bkit",
  detail: 'Please choose a another location'
}

const wronglocation = {
  title: 'Wrong location for bk Client',
  message: "The chosen location isn't empty or is not a git repository",
  detail: 'Please choose a another location'
}

const installbKit = async (location, force = false) => {
  const git = require('simple-git/promise')(location)
  git.addConfig('core.autocrlf', false)
  if (isEmpty(location)) {
    console.log('Git clone to', location)
    await git.clone(BKIT, location, ['--depth', 1])
  } else {
    const isrepo = await git.checkIsRepo()
    if (isrepo) {
      console.log('"%s" is a Repo', location)
      try {
        const remotes = await git.getRemotes(true )
        console.log('Remotes', remotes)
        if (remotes.some(e => e.refs && e.refs.fetch && e.refs.fetch === BKIT)) {
          if (!isBkitClintInstalled(location)) {
            console.log('Git hard reset Repo on "%s"', location)
            await git.reset(['--hard'])
          }          
        } else {
          console.log('"%s" is not a bKit Repo', location)
          return await install2AlternateLocation(location, notbkitrepo)
        }
      } catch(err) {
        console.warn("Wasn't possible to pull/reset repository to %s", location )
      }
    } else {
      return await install2AlternateLocation(location, wronglocation)
    }
  }
  if (!bkitping(location)) winInstall(location)
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
      if (isWin && !isAdmin()) {
        runasAdmin()
      } else {
        return await install2AlternateLocation(dst)
      }
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

export const isBkitClintInstalled = (bKitPath) => {
  return bKitPath && existsSync(bKitPath) && list.every(e => {
    const fullpath = path.join(bKitPath, e)
    return existsSync(fullpath)
  })
}

const BASH = isWin ? 'bash.bat' : 'bash'

function bkitping (bKitPath) {
  try {
    console.log('bkitping on', bKitPath)
    const msg = 'aqui'
    const result = spawnSync(BASH, ['./bash.sh', 'echo', msg], { cwd: bKitPath, windowsHide: true })
    console.log('result', result)
    return result.stdout.toString().replace(/(\r|\n|\s)*$/, '') === msg
  } catch (err) {
    console.warn('bKitping fail:', err)
    return false
  }
}

const impossible2install = {
  title: 'Impossible to install',
  message: "Errors while instaling on given location",
  detail: 'Please choose a another location'
}

function winInstall (bKitPath) {
  if (!isWin) return
  try {
    const result = spawnSync(
      'CMD',
      ['/C', 'setup.bat'],
      { cwd: bKitPath, windowsHide: false }
    )
    console.log('winInstall.stdout', result.stdout.toString())
    console.log('winInstall.stderr', result.stderr.toString())
    console.log('winInstall.status', result.status)
    console.log('winInstall.error', result.error)
    if (result.status !== 0) {
      install2AlternateLocation(location, winInstall)
    } 
  } catch (err) {
    console.error(err)
  }
}

export const isbkitok = (bKitPath) => isBkitClintInstalled(bKitPath) && bkitping(bKitPath)