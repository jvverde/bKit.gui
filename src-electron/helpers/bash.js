// let wsList = {}
'use strict'
let [BASH, TERM] = ['bash', 'xterm']
const { spawn } = require('child_process')
const readline = require('readline')
import { ipcRenderer } from 'electron'
import { getbkitPath } from '../bkitClient'
import say  from '../utils/say'

const nill = () => null
const _timeout = 1000 * 60 * 60 * 24 // 1day

const catched = e => say.error(e)
const warn = w => say.warn(w)

export const username = require('os').userInfo().username

if (process.platform === 'win32') {
  BASH = 'bash.bat'
  TERM = BASH // for windows user bash as a terminal
}

// Spawn a bash script
function _bash (name, args = [], events = {}, done = nill) {
  const scriptname = typeof name === 'object' ? name.script : name
  const warn = (err) => say.warn(`Received on stderr from script ${scriptname}: ${err}`)
  const { onreadline = nill, onerror = catched, stderr = warn, oncespawn = nill, oncedone = nill } = events
  const close = code => {
    try {
      oncedone(code)
      stoptimeout()
      if (fd.stdin) fd.stdin.pause()
      // say.log('Kill process Family of', pid, fd)
      // if (fd.pid) process.kill(`-${pid}`)
      fd.kill()
    } catch (err) {
      say.warn('When try to kill', fd, err)
    } finally {
      done(code)
    }
  }
  let closeOnce = code => {
    closeOnce = nill
    say.log('closeOnce', scriptname, ...args)
    close(code)
  }
  const bKitPath = getbkitPath()
  say.log(`Try spawn ${scriptname} on ${bKitPath} `)
  const options = { cwd: bKitPath, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }
  if (name.env) options.env = name.env
  const fd = spawn(
    BASH,
    ['./run.sh', scriptname, ...args],
    // [scriptname, ...args],
    options
  )
  say.log('Spawned', scriptname, ...args)

  const mytimeout = () => {
    say.log('kill by timeout')
    if (fd.stdin) fd.stdin.pause() // just in case
    fd.kill()
  }
  const stoptimeout = () => {
    if (fd._timeout) clearTimeout(fd._timeout)
  }
  const inittimeout = (timeout = _timeout) => {
    fd._timeout = setTimeout(mytimeout, timeout)
  }
  const resettimeout = (timeout = _timeout) => {
    stoptimeout()
    inittimeout(timeout)
  }

  inittimeout(_timeout) // 24h

  fd.on('close', (code) => {
    say.log('Close', scriptname, ...args)
    if (code) say.warn(`Return code ${code} is NOT ok for ${scriptname}`)
    closeOnce(code)
  })

  fd.on('error', onerror)

  fd.on('exit', err => {
    err = 0 | err
    say.log(`Exit ${scriptname} with value ${err}`)
    if (err !== 0) {
      const params = args.join(' ')
      onerror(`Call to '${scriptname} ${params}' exit with code ${err}`)
    }
    closeOnce(err)
  })

  fd.on('disconnect', err => {
    say.error('Disconnect', err)
    closeOnce(err)
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
    say.log('Readline close', scriptname)
    closeOnce(undefined)
    resettimeout()
  })
  fd.stderr.on('data', err => {
    say.warn(`Read on stderr from ${scriptname}: ${err}`)
    const error = `${err}`
    const result = stderr(error)
    if (result === 'stop') { // if receive a stop from upper layers
      closeOnce(err) // ...
      // fd.kill() // also kill the process
    }
  })
  oncespawn(fd)
}

export function bash (name, args = [], events = {}) {
  const {
    onclose = () => say.log('Close', name),
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
    const done = code => resolve(lines)
    const onerror = reject
    _bash(name, args, { ...events, onreadline, onerror }, done)
  })
}
