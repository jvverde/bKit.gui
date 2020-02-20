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

function invoke (script, done) {
  const fd = spawn(
    BASH,
    [script.name, ...script.args],
    { cwd: bKitPath, windowsHide: true }
  )
  fd.on('close', (code) => {
    done(code)
  })
  const rl = readline.createInterface({
    input: fd.stdout,
    output: process.stdout
  })
  rl.on('line', script.onreadline)
  fd.stderr.on('data', script.onerror)
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
