import path from 'path'
import { readFileSync, readdirSync, existsSync, mkdirSync, accessSync, constants } from 'fs'
import { spawnSync, execSync } from 'child_process'

import { app, dialog } from 'electron'

if (process.env.PROD) {
  global.__statics = path.join(__dirname, 'statics').replace(/\\/g, '\\\\')
}

const BKIT = 'https://github.com/jvverde/bKit.git'

const mkdir = (path) => { return mkdirSync(path, { recursive: true }) }

const isWin = process.platform === 'win32'

const isAdmin = isWin && (() => {
  try{
    console.log('Check admin rights')
    execSync('NET SESSION') 
    return true
  } catch (err) {
    return false
  } 
})()

const isEmpty = (path) => { return readdirSync(path).length === 0 }

const elevate = () => {
  if (isWin && isAdmin) {
    throw new Error('I am already run as admin')
  } else if (isWin) {
    const executeSync = require('elevator').executeSync
    //const args = process.argv.concat(['--elevated'])
    const args = process.argv
    console.log('Elevate', args)
    executeSync(args, {
      waitForTermination: true
    }, function(error, stdout, stderr) {
      if (error) {
        throw error
      }
      console.log(stdout)
      console.log(stderr)
    })
  } else {
    throw new Error('I am supposed to be called only in a windows platform')
  }
}

const runasAdmin = () => {
  console.log('Run as Administrator')
  elevate()
  console.log('Continue run as normal user')
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
  console.log('installbKit', location)
  try {
    if (isEmpty(location)) {
      const git = require('nodegit')
      console.log('Location "%s" is empty', location)
      const result = await git.clone(BKIT, location)
      console.log('after git clone', result)    
    } else {
      // const git = require('simple-git/promise')(location)
      // git.addConfig('core.autocrlf', false)
      // const isrepo = await git.checkIsRepo()
      // if (isrepo) {
      //   console.log('"%s" is a Repo', location)
      //   const remotes = await git.getRemotes(true )
      //   if (remotes.some(e => e.refs && e.refs.fetch && e.refs.fetch === BKIT)) {
      //     if (!isBkitClintInstalled(location)) {
      //       console.log('Git hard reset Repo on "%s"', location)
      //       await git.reset(['--hard'])
      //     }          
      //   } else {
      //     console.log('However "%s" is not a bKit Repo', location)
      //     return await install2AlternateLocation(location, notbkitrepo)
      //   }
      // } else {
      //   return await install2AlternateLocation(location, wronglocation)
      // }
    }
    // if (!bkitping(location)) winInstall(location)
  } catch(err) {
    console.warn("Wasn't possible to pull/reset repository to", location, err )
  }
  return location
}

const checkRights = (dst) => {
  try {
    if (!existsSync(dst)) mkdir(dst)
    console.log('Test write access to %s', dst)
    accessSync(dst, constants.W_OK)
    console.log('Yes, I can write on %s', dst)
    return true
  } catch (err) {
    return false
  }
} 

const syncdir = require('sync-directory')

const install = (dst) => {
  if (checkRights(dst)) {
    const setup = path.join(__statics, 'setup')
    console.log('sync', setup, dst)
    syncdir(setup, dst)
    return Promise.resolve(true)
  } else {
    return install2AlternateLocation(dst)
  }
}

export const setupbkit = (dst) => {
  console.log('setupbkit', dst)
  if (isWin && !isAdmin) {
    runasAdmin()
  } else {
    return install(dst)
      .then(() => {
        if (isAdmin && app.commandLine.hasSwitch('--elevated')) {
          console.log('The elevated run instance will quit now')
          app.quit()
        }      
      })
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
