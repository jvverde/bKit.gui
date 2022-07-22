// let wsList = {}
'use strict'
let [BASH, TERM] = ['bash', 'xterm']
const { spawn } = require('child_process')
const readline = require('readline')
import { ipcRenderer } from 'electron'

const nill = () => null

import { warn } from './notify'

export const username = require('os').userInfo().username

if (process.platform === 'win32') {
  BASH = 'bash.bat'
  TERM = BASH // for windows user bash as a terminal
}

const getbkitlocation = () => ipcRenderer.sendSync('getbkitPath')

export function shell () {
  const bKitPath = getbkitlocation()
  const fd = spawn(
    TERM,
    [],
    { cwd: bKitPath, windowsHide: false, detached: true, stdio: 'ignore' }
  )
  fd.unref()
}

// Spawn a bash script
function _bash (name, args = [], events = {}, done = nill) {
  const scriptname = typeof name === 'object' ? name.script : name
  const warn = (err) => console.warn(`Received on stderr from script ${scriptname}: ${err}`)

  const { onreadline = nill, onerror = nill, stderr = warn, oncespawn = nill } = events
  let doneOnce = code => {
    try {
      doneOnce = nill
      stoptimeout()
      if (fd.stdin) fd.stdin.pause()
      // console.log('Kill process Family of', pid, fd)
      // if (fd.pid) process.kill(`-${pid}`)
      fd.kill()
    } catch (err) {
      console.warn(`When try to kill family of ${name} [${pid}] ${args}`, err, fd)
    } finally {
      console.log('Done', scriptname, ...args)
      done(code)
    }
  }
  const bKitPath = getbkitlocation()
  console.log(`Try spawn ${scriptname} on ${bKitPath} `)
  const options = { cwd: bKitPath, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }
  if (name.env) options.env = name.env
  const fd = spawn(
    BASH,
    ['./run.sh', scriptname, ...args],
    // [scriptname, ...args],
    options
  )
  const pid = fd.pid
  console.log('Spawned', scriptname, ...args)

  const mytimeout = () => {
    console.log('kill by timeout')
    if (fd.stdin) fd.stdin.pause() // just in case
    fd.kill()
  }
  const stoptimeout = () => {
    if (fd._timeout) clearTimeout(fd._timeout)
  }
  const inittimeout = (timeout = 600000) => {
    fd._timeout = setTimeout(mytimeout, timeout)
  }
  const resettimeout = (timeout = 600000) => {
    stoptimeout()
    inittimeout(timeout)
  }

  inittimeout(6000000) // 100 minutos

  fd.on('close', (code) => {
    console.log('Done spawn', scriptname, ...args)
    if (code) console.warn(`Return code ${code} is NOT ok`)
    doneOnce(code)
  })

  fd.on('error', onerror)

  fd.on('exit', err => {
    console.log(`Receive exit for spawn ${scriptname} with value ${err}`)
    err = 0 | err
    if (err !== 0) {
      const params = args.join(' ')
      onerror(`Call to '${scriptname} ${params}' exit with code ${err}`)
    }
    doneOnce(0)
  })

  fd.on('disconnect', err => {
    console.error('Disconnect', err)
    doneOnce(err)
  })
  const rl = readline.createInterface({
    input: fd.stdout,
    output: fd.stdin
  })
  rl.on('line', (data) => {
    resettimeout()
    onreadline(data)
  })
  rl.on('close', () => {
    console.log('Readline close', scriptname)
    doneOnce()
  })
  fd.stderr.on('data', err => {
    // console.warn(`Read on stderr from ${scriptname}: ${err}`)
    const error = `${err}`
    const result = stderr(error)
    if (result === 'stop') { // if receive a stop from upper layers
      doneOnce() // send a empty done
      // fd.kill() // also kill the process
    }
  })
  oncespawn(fd)
}

export function bash (name, args = [], events = {}) {
  const {
    onclose = () => console.log('Close', name),
    onreadline = () => false,
    onerror = (err) => warn(`Error calling script ${name}: ${err}`, true)
  } = events
  return _bash(name, args, { ...events, onreadline, onerror }, onclose)
}

// Provide a promise to invoke bash
export function asyncBash (name, args = [], events = {}) {
  const lines = []
  const { onreadline = line => lines.push(line) } = events
  return new Promise((resolve, reject) => {
    const done = () => resolve(lines)
    const onerror = reject
    _bash(name, args, { ...events, onreadline, onerror }, done)
  })
}

export function killtree (pid) {
  console.log('Kill tree of process', pid)
  return new Promise((resolve, reject) => {
    _bash('./killtree.sh', [pid], { onerror: reject }, resolve)
  })
}

// _bash({ script: 't.sh', env: { XPTO: 'vvvvvv' } }, [], { onreadline: (arg) => console.log('t.sh:', arg) })
// _bash('t.sh', [], { onreadline: (arg) => console.log('t.sh:', arg) })
