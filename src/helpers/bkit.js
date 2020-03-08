// let wsList = {}
let [BASH, TERM] = ['bash', 'xterm']
let username = require('os').userInfo().username
const { spawn, execSync } = require('child_process')
const readline = require('readline')
const { ipcRenderer } = require('electron')
import queue from 'async/queue'

if (process.platform === 'win32') {
  try {
    execSync('NET SESSION')
    BASH = 'sbash.bat'
    username = 'SYSTEM'
  } catch {
    BASH = 'bash.bat'
  }
  TERM = BASH // for windows user bash as a terminal
}

const bKitPath = ipcRenderer.sendSync('getbKitPath')

import { Notify } from 'quasar'

export function user () {
  return username
}

function invoke ({ name, args, onreadline, onerror }, done) {
  const fd = spawn(
    BASH,
    [name, ...args],
    { cwd: bKitPath, windowsHide: true }
  )
  fd.on('close', (code) => {
    done(code)
  })
  const rl = readline.createInterface({
    input: fd.stdout,
    output: process.stdout
  })
  rl.on('line', onreadline)
  fd.stderr.on('data', onerror)
}

export function shell () {
  const fd = spawn(
    TERM,
    [],
    { cwd: bKitPath, windowsHide: false, detached: true, stdio: 'ignore' }
  )
  fd.unref()
}

const invokequeue = queue(invoke)

export function bash (scriptname, args, {
  onclose = () => console.log('Close', scriptname),
  onreadline = () => {},
  onerror = (err) => {
    console.error(`Error calling script ${scriptname}: ${err}`)
    Notify.create({
      message: `${scriptname}: ${err}`,
      multiline: true,
      icon: 'warning'
    })
  }
}) {
  invokequeue.push({ name: scriptname, args, onreadline, onerror }, onclose)
  return null
}

const regexp = /([a-z-]+)\s+([0-9,]+)\s+([0-9/]+)\s+([0-9:]+)\s+(.+)/

export function listdirs (fullpath, { entry, atend = () => console.log('List dirs done') }) {
  bash('./listdirs.sh', [fullpath], {
    onclose: atend,
    onreadline: (data) => {
      console.log('Listdir:', data)
      const match = data.match(regexp)
      if (match && match[5] !== '.') { // only if not current directory
        const name = match[5]
        const status = 'onbackup'
        const fullname = path.join(fullpath, name)
        const isdir = match[0].startsWith('d')
        entry({ name, status, path: fullname, isdir })
      }
    }
  })
}

/* ------------------- */

const terminate = require('terminate')

export function stop (process) {
  if (process && process.bkitclosed) {
    console.log('Process already closed')
    return
  }
  if (!process) {
    console.error('Process cannot be null or undefined')
    return
  }
  terminate(process.pid, (err) => {
    if (err) {
      console.error('Oopsy: ' + err)
    } else {
      console.log('Process stop done')
    }
  })
}
// Windows workaroud to kill a process
// var spawn = require('child_process').spawn
// spawn("taskkill", ["/pid", child.pid, '/f', '/t']);
// export function remove (url) {
//   delete wsList[url]
// }
// export function get (url) {
//   return wsList[url]
// }

const path = require('path')
// <f+++++++++|2020/02/22-16:05:08|99|/home/jvv/projectos/bkit/apps/webapp.oldversion/.eslintignore
const regexpNewFile = /^[><]f[+]{9}[|]([^|]*)[|]([^|]*)[|]([^|]*)/
const regexpNewDir = /^cd[+]{9}[|]([^|]*)[|]([^|]*)[|]([^|]*)/
const regexpChgDir = /^[.]d.{9}[|]([^|]*)[|]([^|]*)[|]([^|]*)/
// <f.st......|2020/02/23-18:24:04|1652|/home/jvv/projectos/bkit/apps/client/package.json
// <f..t......
const regexpChgFile = /^[><]f.(?:s.|.t).{6}[|]([^|]*)[|]([^|]*)[|]([^|]*)/
const regexpDelete = /^[*]deleting\s*[|]([^|]*)[|]([^|]*)[|]([^|]*)/

export function onRsyncLine ({
  close = () => false,
  newFile = () => false,
  newDir = () => false,
  chgFile = () => false,
  chgDir = () => false,
  deleted = () => false,
  newLink = () => false,
  newHlink = () => false
}) {
  const match = (line, exp, dispatch) => {
    const isaMatch = line.match(exp)
    if (isaMatch) {
      dispatch(isaMatch[3])
      return true
    }
    return false
  }
  const isnewfile = (filename) => {
    newFile({ name: path.basename(filename), path: filename, status: 'new', isfile: true })
  }
  const isnewdir = (filename) => {
    newDir({ name: path.basename(filename), path: filename, status: 'new', isdir: true })
  }
  const filechanged = (filename) => {
    chgFile({ name: path.basename(filename), path: filename, status: 'modified', isfile: true })
  }
  const dirchanged = (filename) => {
    chgDir({ name: path.basename(filename), path: filename, status: 'modified', isdir: true })
  }
  const entrydeleted = (filename) => {
    deleted({ name: path.basename(filename), path: filename, status: 'deleted' })
  }
  const onreadline = (line) => {
    console.log('Read Line:', line)
    if (!match(line, regexpNewFile, isnewfile) &&
      !match(line, regexpChgFile, filechanged) &&
      !match(line, regexpNewDir, isnewdir) &&
      !match(line, regexpChgDir, dirchanged) &&
      !match(line, regexpDelete, entrydeleted)) {
      console.log('Is something else:', line)
    }
  }
  return {
    onclose: close,
    onreadline
  }
}
