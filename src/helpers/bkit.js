// let wsList = {}
'use strict'
let [BASH, TERM] = ['bash', 'xterm']
let username = require('os').userInfo().username
const { spawn, execSync } = require('child_process')
const readline = require('readline')
const { ipcRenderer } = require('electron')
const path = require('path')

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

// This is a adapter to invoke bash
function invokeBash ({ name, args, onreadline, onerror }, done) {
  console.log(`Spawn ${name} with args`, args)
  const fd = spawn(
    BASH,
    [name, ...args],
    { cwd: bKitPath, windowsHide: true }
  )
  fd.on('close', (code) => {
    // console.log(`Done spawn ${name} with args`, args)
    done(code)
  })
  fd.on('error', onerror)
  const rl = readline.createInterface({
    input: fd.stdout,
    output: process.stdout
  })
  rl.on('line', onreadline)
  fd.stderr.on('data', (err) => {
    console.warn(`Errors from bash script ${name}: ${err}`, err)
  })
}

export function bash (scriptname, args, {
  onclose = () => console.log('Close', scriptname),
  onreadline = () => false,
  onerror = (err) => warn(`Error calling script ${scriptname}: ${err}`, true)
}) {
  return invokeBash({ name: scriptname, args, onreadline, onerror }, onclose)
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

/* ------------------ define queues and proxis/caches --------------- */
import { QueueLast, QueueByKey } from './queue'
const queue4Remote = new QueueByKey() // This is intend to queue remote request
const queue4Local = new QueueByKey() // This is intend to queue local request
const defaultQueue = new QueueByKey() // To be used for everything else

// Enqueue bash scripts
export function enqueue2bash (name, args, queue = defaultQueue) {
  const key = name + args.join('')
  return queue.enqueue(() => asyncInvokeBash(name, args), key)
}
// enqueue2bash('./listdisks.sh', [])
//  .then(disk => console.log('ENQUED RVID:', disk))

import { exclusiveProxy, InvalidateCache } from './proxy'

// Proxy (via to Queue) to Bash
const proxy2Q2bash = exclusiveProxy(enqueue2bash, { size: 50, name: 'bash' })

export async function* listDisksOnBackup () {
  for (const disk of await proxy2Q2bash('./listdisks.sh', [], queue4Remote)) {
    yield disk
  }
}

export async function* listLocalDisks () {
  // We don't use cache/proxy for local requests, so we enqueue it directly
  for (const disk of await enqueue2bash('./lib/getdevs.sh', [], queue4Local)) {
    yield disk
  }
}

export async function getServer () {
  return enqueue2bash('./server.sh', [], queue4Local)
}

/* ---------------------listdir--------------------- */
const regexpList = /(?<list>[a-z-]+)\s+(?<size>[0-9,]+)\s+(?<sdate>[0-9/]+)\s+(?<time>[0-9:]+)\s+(?<name>.+)/

function* line2entry ([...lines]) {
  for (const line of lines) {
    console.log('List Line:', line)
    const match = line.match(regexpList)
    const { groups: { list, size, sdate, time, name } } = match || { groups: {} }
    if (match && name !== '.') { // only if not current directory
      const isdir = list.startsWith('d')
      const isregular = list.startsWith('-')
      const date = `${sdate} ${time}`
      yield { name, onbackup, isdir, isregular, date, size }
    }
  }
}

async function _listDirs (args) {
  console.log('Enqueued bash listdir.sh with args', args)
  const lines = await enqueue2bash('./listdirs.sh', args, queue4Remote)
  return [...line2entry(lines)]
}

// Proxy listdir to cache the (already matched) results
const proxy2listdir = exclusiveProxy(_listDirs, { size: 50, name: 'listdir' })

export async function listDirs (path, args) {
  return proxy2listdir([...args, path])
}

/* ---------------------dKit--------------------- */
const regexpNewFile = /^[><]f[+]{9}[|]([^|]*)[|]([^|]*)[|]([^|]*)/
const regexpNewDir = /^cd[+]{9}[|]([^|]*)[|]([^|]*)[|]([^|]*)/
const regexpChgDir = /^[.]d.{9}[|]([^|]*)[|]([^|]*)[|]([^|]*)/
// <f.st......|2020/02/23-18:24:04|1652|/home/jvv/projectos/bkit/apps/client/package.json
// <f..t......
const regexpChgFile = /^[><]f.(?:s.|.t).{6}[|]([^|]*)[|]([^|]*)[|]([^|]*)/
const regexpDelete = /^[*]deleting\s*[|]([^|]*)[|]([^|]*)[|]([^|]*)/

const [isnew, wasmodified, wasdeleted, isdir, isfile, onbackup] = Array(6).fill(true)

function* rsync2entry (lines) {
  let filename
  const match = (line, exp) => {
    const isaMatch = line.match(exp)
    if (isaMatch) {
      filename = isaMatch[3]
      return true
    }
    return false
  }

  for (const line of lines) {
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

async function _dKit (args, path) {
  console.log(`invokeBash _dkit for ${path} with args`, args)
  const fullargs = ['--no-recursive', '--dirs', ...args, path]
  const rsynclines = await enqueue2bash('./dkit.sh', fullargs, queue4Remote)
  return [...rsync2entry(rsynclines)]
}

const proxy2dkit = exclusiveProxy(_dKit, { size: 50, name: 'dkit' })

const _invalidateCache = new InvalidateCache()

export async function dKit (path, args, invalidateCache = false) {
  if (invalidateCache === 5) {
    return proxy2dkit(_invalidateCache, args, path)
  } else {
    return proxy2dkit(args, path)
  }
}

/* *************************** A 2nd-level queue *************************** */
// We want somethinh near to the high level caller,
// in order to dismiss previous request for the same path and same RVID but a different snap
// The idea is to discard unfinished requests for previous snaps

const listdirQueue = new QueueLast()
const dkitQueue = new QueueLast()

export async function listDirOfSnap (path, snap, rvid, {
  args = [],
  queue = listdirQueue
} = {}) {
  const key = rvid + path + args.join('')
  args = [`--rvid=${rvid}`, ...args]
  if (snap) args.push(`--snap=${snap}`)
  const promise = () => listDirs(path, args) // A future promise as required by queue.enqueue
  return queue.enqueue(promise, key, `snap:${snap}`)
}

export async function diffList (path, snap, {
  args = [],
  queue = dkitQueue,
  invalidateCache = false
} = {}) {
  const key = path + args.join('')
  if (snap) args.push(`--snap=${snap}`)
  if (invalidateCache) {
    // In this case it needs to go directly to the proxy/cache to invalidade it
    // Otherwise this may be canceled by a future request
    return dKit(path, args)
  } else {
    const promise = () => dKit(path, args) // A future promise as required by queue.enqueue
    return queue.enqueue(promise, key, `snap:${snap}`)
  }
}

/* *************************** End o 2nd-level queue *************************** */

/* ------------------Old Code, but still used by restore components ----------- */
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

/* -------------------------------------- */

export function getLocalDisks (events) {
  return bash('./lib/getdevs.sh', [], events)
}

export function getDisksOnBackup (events) {
  return bash('./listdisks.sh', [], events)
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
  })
}
