// let wsList = {}
let [BASH, TERM] = ['bash', 'xterm']
let username = require('os').userInfo().username
const { spawn, execSync } = require('child_process')
const readline = require('readline')
const { ipcRenderer } = require('electron')
import queue from 'async/queue'
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

// This is a adapter to invoke bash
function invokeBash ({ name, args, onreadline, onerror }, done) {
  console.log(`Spawn ${name} with args`, args)
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

// Provide a promise to invoke bash
export function asyncInvokeBash (name, args) {
  return new Promise((resolve, reject) => {
    const lines = []
    const onreadline = line => lines.push(line)
    const done = () => resolve(lines)
    const onerror = reject
    invokeBash({ name, args, onreadline, onerror }, done)
  })
}

// asyncInvokeBash('./listdisks.sh', [])
//  .then(disk => console.log('RVID:', disk))

import Queue from './queue'
const defaultAsyncQueue = new Queue()

export function enqueue2bash (name, args, queue = defaultAsyncQueue) {
  const key = name + args.join('')
  return queue.enqueue(() => asyncInvokeBash(name, args), key)
}

// enqueue2bash('./listdisks.sh', [])
//  .then(disk => console.log('ENQUED RVID:', disk))

import { exclusiveProxy } from './proxy'

const asyncQueue4Remote = new Queue() // This is intend to queue remote request
const asyncQueue4Local = new Queue() // This is intend to queue local request

// Proxy (via to Queue) to Bash
const proxy2Q2bash = exclusiveProxy(enqueue2bash, { size: 50, name: 'bash' })

export async function* listDisksOnBackup () {
  for (const disk of await proxy2Q2bash('./listdisks.sh', [], asyncQueue4Remote)) {
    yield disk
  }
}

export async function* listLocalDisks () {
  // We don't use cache for local requests, so we enqueue it directly
  for (const disk of await enqueue2bash('./lib/getdevs.sh', [], asyncQueue4Local)) {
    yield disk
  }
}

export async function getServer () {
  return enqueue2bash('./server.sh', [], asyncQueue4Local)
}

const regexpList = /(?<list>[a-z-]+)\s+(?<size>[0-9,]+)\s+(?<sdate>[0-9/]+)\s+(?<time>[0-9:]+)\s+(?<name>.+)/

function* line2entry ([...lines], fullpath) {
  for (const line in lines) {
    console.log('List Line:', line)
    const match = line.match(regexpList)
    const { groups: { list, size, sdate, time, name } } = match || { groups: {} }
    if (match && name !== '.') { // only if not current directory
      const fullname = path.join(fullpath, name)
      const isdir = list.startsWith('d')
      const isregular = list.startsWith('-')
      const date = `${sdate} ${time}`
      yield { name, onbackup, path: fullname, isdir, isregular, date, size }
    }
  }
}

async function _listDirs (args) {
  const fullpath = args[args.length - 1]
  console.log(`invokeBash listdir with args`, args)
  const lines = await enqueue2bash('./listdirs.sh', args, asyncQueue4Remote)
  return [...line2entry(lines, fullpath)]
}

// Proxy listdir to cache the (already matched) results
const proxy2list = exclusiveProxy(_listDirs, { size: 50, name: 'listdir' })

export async function listDirs (args) {
  return proxy2list(args)
}

async function _dKit (args) {
  console.log(`invokeBash listdir with args`, args)
  const fullargs = ['--no-recursive', '--dirs', ...args]
  const rsynclines = await enqueue2bash('./dkit.sh', fullargs, asyncQueue4Remote)
  return [...rsync2entry(rsynclines)]
}

const proxy2dkit = exclusiveProxy(_dKit, { size: 50, name: 'dkit' })

export async function dKit (args) {
  return proxy2dkit(args)
}

function* rsync2entry (lines) {
  let filename
  const match = (line, exp, dispatch) => {
    const isaMatch = line.match(exp)
    if (isaMatch) {
      filename = isaMatch[3]
      return true
    }
    return false
  }

  for (const line in lines) {
    console.log('Read Line:', line)
    if (match(line, regexpNewFile)) {
      yield { name: path.basename(filename), path: filename, isnew, isfile }
    } else if (match(line, regexpChgFile)) {
      yield { name: path.basename(filename), path: filename, wasmodified, isfile, onbackup }
    } else if (match(line, regexpNewDir)) {
      yield { name: path.basename(filename), path: filename, isnew, isdir }
    } else if (match(line, regexpChgDir)) {
      yield { name: path.basename(filename), path: filename, wasmodified, isdir, onbackup }
    } else if (match(line, regexpDelete)) {
      yield { name: path.basename(filename), path: filename, wasdeleted, onbackup }
    } else {
      console.warn('Is something else:', line)
    }
  }
}

/* ------------------------------------------------- */
export function shell () {
  const fd = spawn(
    TERM,
    [],
    { cwd: bKitPath, windowsHide: false, detached: true, stdio: 'ignore' }
  )
  fd.unref()
}

const defaultQueue = queue(invokeBash) // default queue to serialize requests
export const localQueue = queue(invokeBash) // queue for run local scripts
export const remoteQueue = queue(invokeBash) // queue for run remote scripts

export function bash (scriptname, args, {
  onclose = () => console.log('Close', scriptname),
  onreadline = () => false,
  onerror = (err) => warn(`Error calling script ${scriptname}: ${err}`, true)
}, q = defaultQueue) {
  q.push({ name: scriptname, args, onreadline, onerror }, onclose)
  return null
}

export function newBashQueue () {
  return queue(invokeBash)
}

export function newQueue (task) {
  return queue(task)
}

/* ------------------- */

// const terminate = require('terminate')

// export function stop (process) {
//   if (process && process.bkitclosed) {
//     console.log('Process already closed')
//     return
//   }
//   if (!process) {
//     console.error('Process cannot be null or undefined')
//     return
//   }
//   terminate(process.pid, (err) => {
//     if (err) {
//       console.error('Oopsy: ' + err)
//     } else {
//       console.log('Process stop done')
//     }
//   })
// }
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

const [isnew, wasmodified, wasdeleted, isdir, isfile, onbackup] = Array(6).fill(true)

export function onRsyncLine ({
  newFile = () => false,
  newDir = () => false,
  chgFile = () => false,
  chgDir = () => false,
  deleted = () => false,
  newLink = () => false,
  newHlink = () => false
}, done = () => false) {
  const match = (line, exp, dispatch) => {
    const isaMatch = line.match(exp)
    if (isaMatch) {
      dispatch(isaMatch[3])
      return true
    }
    return false
  }
  const isnewfile = (filename) => {
    newFile({ name: path.basename(filename), path: filename, isnew, isfile })
  }
  const isnewdir = (filename) => {
    newDir({ name: path.basename(filename), path: filename, isnew, isdir })
  }
  const filechanged = (filename) => {
    chgFile({ name: path.basename(filename), path: filename, wasmodified, isfile, onbackup })
  }
  const dirchanged = (filename) => {
    chgDir({ name: path.basename(filename), path: filename, wasmodified, isdir, onbackup })
  }
  const entrydeleted = (filename) => {
    deleted({ name: path.basename(filename), path: filename, wasdeleted, onbackup })
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
    onclose: done,
    onreadline
  }
}

export function dkit (args, events, done = () => console.log('dkit done')) {
  // console.log('events', events)
  console.log(`invokeBash dkit with args`, args)
  const actions = onRsyncLine(events, done)
  // const args = ['--no-recursive', '--delete', '--dirs', `${fullpath}`]
  const fullargs = ['--no-recursive', '--dirs', ...args]
  bash('./dkit.sh', fullargs, actions)
}

export function listdirs (args, entry, done = () => console.log('List dirs done')) {
  const fullpath = args[args.length - 1]
  console.log(`invokeBash listdir with args`, args)
  bash('./listdirs.sh', args, {
    onclose: done,
    onreadline: (data) => {
      console.log('Listdir:', data)
      const match = data.match(regexpList)
      const { groups: { list, size, sdate, time, name } } = match || { groups: {} }
      if (match && name !== '.') { // only if not current directory
        const fullname = path.join(fullpath, name)
        const isdir = list.startsWith('d')
        const isregular = list.startsWith('-')
        const date = `${sdate} ${time}`
        entry({ name, onbackup, path: fullname, isdir, isregular, date, size })
      }
    }
  })
}

import { makeItCacheable } from './cache'

const cachedListdirs = makeItCacheable(listdirs)
const cachedDkit = makeItCacheable(dkit)

const _dkit = ({ args, events, name }, done) => {
  // console.log(name, args)
  cachedDkit(args, events, done)
}

const _listdirs = ({ args, events, name }, done) => {
  // console.log(name, args)
  cachedListdirs(args, events, done)
}

const _discard = (msg) => console.warn(`${msg.name}: ${msg.path} already in queue`)

function makeQueue (action, name) { // create a queue where duplicated requests will be discarded
  const q = queue(action)
  return function (path, args, events, done = () => false, discard = _discard) {
    args.push(path)
    const items = [...q]
    const str = args.join('')
    if (items.some(item => item.str === str)) {
      discard({ name, path }) // discard request for the same path
    } else {
      q.push({ args, str, events, name }, done)
    }
  }
}

export function enqueuedkit (name = 'dKit') {
  return makeQueue(_dkit, name)
}

export function enqueueListdir (name = 'ListDir') {
  return makeQueue(_listdirs, name)
}
/* -------------------------------------- */

export function getLocalDisks (events) {
  return bash('./lib/getdevs.sh', [], events, localQueue)
}

export function getDisksOnBackup (events) {
  return bash('./listdisks.sh', [], events, remoteQueue)
}

export function getDisks ({ onclose, entry }) {
  bash('./listdisks.sh', [], {
    onclose,
    onreadline: (rvid) => {
      console.log('LISTDISK:', rvid)
      let [ letter, uuid, label, , ] = rvid.split('.')
      let name = ''
      if (letter !== '_') {
        name = letter + ':'
        if (label !== '_') name += ` [${label}]`
      } else if (label !== '_') {
        name = label
      } else {
        name = uuid
      }
      entry({
        name,
        rvid,
        uuid,
        label,
        letter,
        mountpoint: '*',
        present: false
      })
    }
  }, remoteQueue)
}
