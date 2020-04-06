// let wsList = {}
'use strict'
let [BASH, TERM] = ['bash', 'xterm']
let username = require('os').userInfo().username
const { spawn, execSync } = require('child_process')
const readline = require('readline')
const { ipcRenderer } = require('electron')
const nill = () => null

import { warn } from './notify'

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

export function user () {
  return username
}

export function shell () {
  const fd = spawn(
    TERM,
    [],
    { cwd: bKitPath, windowsHide: false, detached: true, stdio: 'ignore' }
  )
  fd.unref()
}

const terminate = require('terminate')

export function stop (process) {
  return new Promise((resolve, reject) => {
    if (!process) {
      return reject(`Process cannot be '${process}'`)
    }
    if (process.killed) {
      return reject('Process already closed')
    }
    terminate(process.pid, (err) => {
      if (err) {
        reject(`Problems to terminate ${err}`)
      } else {
        resolve(`Process ${process.pid} stop done`)
      }
    })
  })
}

// This is a adapter to invoke bash
function invokeBash (name, args, events = {}, done = nill) {
  const warn = (err) => console.warn(`Errors from bash script ${name}: ${err}`)

  const { onreadline = nill, onerror = nill, stderr = warn, oncespawn = nill } = events

  console.log(`Spawn ${name} with args`, args)
  const fd = spawn(
    BASH,
    [name, ...args],
    { cwd: bKitPath, windowsHide: true }
  )

  oncespawn(fd)

  fd.on('close', (code) => {
    console.log(`Done spawn ${name} with args`, args)
    done(code)
    fd.bkitclosed = true
  })

  fd.on('error', err => {
    console.log('Error', err)
    onerror(err)
  })

  fd.on('exit', err => {
    err = 0 | err
    if (err !== 0) {
      const params = args.join(' ')
      onerror(`'${name} ${params}' exit with code ${err}`)
      rl.close()
    }
  })

  fd.on('disconnect', err => {
    console.log('Disconnect', err)
  })
  const rl = readline.createInterface({
    input: fd.stdout,
    output: process.stdout
  })
  rl.on('line', onreadline)

  fd.stderr.on('data', err => {
    const r = stderr(err)
    console.log('stderr', r)
    if (r === 'stop') {
      done()
      done = nill
      fd.kill()
    }
  })
}

export function bash (scriptname, args, {
  onclose = () => console.log('Close', scriptname),
  onreadline = () => false,
  onerror = (err) => warn(`Error calling script ${scriptname}: ${err}`, true)
}) {
  return invokeBash(scriptname, args, { onreadline, onerror }, onclose)
}

// Provide a promise to invoke bash
export function asyncInvokeBash (name, args, events = {}) {
  const lines = []
  const { onreadline = line => lines.push(line) } = events
  return new Promise((resolve, reject) => {
    const done = () => resolve(lines)
    const onerror = reject
    invokeBash(name, args, { ...events, onreadline, onerror }, done)
  })
}
