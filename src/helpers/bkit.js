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
export function asyncInvokeBash (name, args, { onreadline } = {}) {
  const lines = []
  const myreadline = line => lines.push(line)
  onreadline = onreadline || myreadline
  return new Promise((resolve, reject) => {
    const done = () => resolve(lines)
    const onerror = reject
    invokeBash({ name, args, onreadline, onerror }, done)
  })
}
// asyncInvokeBash('./listdisks.sh', [])
//  .then(disk => console.log('RVID:', disk))

/* ------------------ define queues and proxis/caches --------------- */
import Queue, { QueueLast, QueueByKey } from './queue'
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

/* *************************** rKit/bKit *************************** */
const restoreQueue = new Queue() // Dedicated queue for restore requests
const backupQueue = new Queue() // Dedicated queue for restore requests
// Enqueue bash scripts
function _Queue (name, args, events = {}, queue = restoreQueue) {
  return queue.enqueue(() => asyncInvokeBash(name, args, events))
}

export function rKit (path, options, rsyncoptions, events) {
  const specificOptions = [
    '--no-A', '--no-g', '--no-p',
    '--delay-updates', // if we want to receive a file list ahead
    '--info=PROGRESS2,STATS2,NAME2'
  ]
  const onreadline = matchLine4rKit(events)
  return _kit('./rkit.sh', path, {
    options,
    rsyncoptions: [...rsyncoptions, ...specificOptions],
    onreadline,
    queue: restoreQueue
  })
}

export function bKit (path, options, rsyncoptions, events) {
  // rsyncoptions.push('--dry-run')
  const onreadline = matchLine4bKit(events)
  return _kit('./bkit.sh', path, {
    options,
    rsyncoptions,
    onreadline,
    queue: backupQueue
  })
}

function matchLine4rKit ({
  onstart = () => null,
  onfinish = () => null,
  onrecvfile = () => null,
  ontotalfiles = (n) => null,
  ontotalsize = (val) => null,
  onprogress = null
} = {}) {
  const rKitRegEx = /^"send\|(.)(.)([^|]+)\|([^|]+)\|([^|]+)\|.*"$/

  return (data) => {
    console.info('rKit line:', data)
    if (data.match(/^Start Restore/)) onstart(data)
    else if (data.match(/^Finish at/)) onfinish(data)
    else {
      const recv = data.match(rKitRegEx)
      if (recv instanceof Array) onrecvfile(recv)
      else {
        const match = data.match(/^\s*(\d+)\s+files/)
        if (match instanceof Array) {
          ontotalfiles(0 | match[1])
        } else {
          const matchsize = data.match(/^total size is (.+?)\s/)
          if (matchsize instanceof Array) ontotalsize(matchsize[1])
          else if (onprogress) { // don't waist time if handler is not defined
            const progress = data.match(/\s*([0-9.mkgb]+)\s+([0-9]+)%\s+([0-9.mkgb/s]+)/i)
            if (progress instanceof Array) {
              onprogress(progress)
            }
          } // inner inner inner else
        } // inner inner else
      } // inner else
    } // else
  } // anounymous function
}

function matchLine4bKit ({
  sent = () => null,
  newphase = () => null,
  done = () => null,
  nfiles = () => null,
  cfiles = () => null,
  dfiles = () => null,
  tfiles = () => null,
  totalsize = () => null,
  transfsize = () => null,
  totalsentbytes = () => null,
  totalrecvbytes = () => null
} = {}) {
  const regexs = [
    {
      // FMT='--out-format="%o|%i|%f|%c|%b|%l|%t"'
      // %o the operation, which is "send", "recv", or "del." (the latter includes the trailing period)
      // %i an itemized list of what is being updated
      // %f the filename (long form on sender; no trailing "/")
      // %c the total size of the block checksums received for the basis file (only when sending)
      // %b the number of bytes actually transferred
      // %l the length of the file in bytes
      // %t the current date time
      // itemize format (%i): YXcstpoguax
      // Example: "send|<f+++++++++|bkit/dirF/y/list.txt|0|0|442|2020/03/30 14:13:58"
      re: /^"send\|(?<Y>.)(?<X>.).(?<s>.)(?<t>.)(?<poguax>.{6})\|(?<file>[^|]+)\|(?<BS>[^|]+)\|(?<bytes>[^|]+)\|(?<size>[^|]+)\|(?<time>[^|]+)"$/,
      handler: match => {
        // tmp/tmp.4pjM5dnMab.bkit.backup/manifest.36018
        if (match.groups.file.match(/tmp\/tmp\..+\.bit\.backup\/manifest\.\d+/)) return
        sent(match.groups, match)
      }
    }, {
      // Phase 1 - Backup new/modified files
      re: /^Phase\b\s*(?<phase>\b[^\s]*?\b)\s+(?<msg>.*$)/,
      handler: match => newphase(match.groups, match)
    }, {
      re: /^bKit:\s*Done/,
      handler: match => done(match.groups, match)
    }, {
      // Number of files: 4 (reg: 3, dir: 1)
      re: /^Number of files: (?<nfiles>\d+) (?<extra>.+)/,
      handler: match => nfiles(match.groups, match)
    }, {
      // Number of created files: 4 (reg: 3, dir: 1)
      re: /^Number of created files: (?<cfiles>\d+) (?<extra>.+)/,
      handler: match => cfiles(match.groups, match)
    }, {
      // Number of deleted files: 0
      re: /^Number of deleted files: (?<dfiles>.+)/,
      handler: match => dfiles(match.groups, match)
    }, {
      // Nummber of regular files transferred: 3
      re: /^Number of regular files transferred: (?<tfiles>.+)/,
      handler: match => tfiles(match.groups, match)
    }, {
      // Total file size: 49 bytes
      re: /^Total file size: (?<dfiles>.+)/,
      handler: match => totalsize(match.groups, match)
    }, {
      // Total transferred file size: 49 bytes
      re: /^Total transferred file size: (?<dfiles>.+)/,
      handler: match => transfsize(match.groups, match)
    }, {
      // Total bytes sent: 5,886
      re: /^Total bytes sent: (?<dfiles>.+)/,
      handler: match => totalsentbytes(match.groups, match)
    }, {
      // Total bytes received: 32
      re: /^Total bytes received: (?<dfiles>.+)/,
      handler: match => totalrecvbytes(match.groups, match)
    }
    /*
      rKit line: Literal data: 0 bytes
      rKit line: Matched data: 0 bytes
      rKit line: File list size: 0
      rKit line: File list generation time: 0.002 seconds
      rKit line: File list transfer time: 0.000 seconds
      rKit line:
      rKit line: sent 5,886 bytes  received 32 bytes  3,945.33 bytes/sec
      rKit line: total size is 49  speedup is 0.01 (DRY RUN)
    */
  ]
  return (data) => {
    console.info('rKit line:', data)
    for (const elem of regexs) {
      const result = data.match(elem.re)
      if (result) {
        console.log('result', result)
        elem.handler(result)
        break
      }
    }
  }
}

function _kit (scriptname, path, {
  options = [],
  rsyncoptions = [],
  onreadline = () => null,
  queue = new Queue()
} = {}) {
  console.log('Enqueue', scriptname)
  const args = [
    ...options,
    '--', // now rsync options
    ...rsyncoptions,
    '--progress',
    // '--dry-run', // TEMPORÁRIO SÓ PARA TESTES
    path
  ]
  return _Queue(scriptname, args, { onreadline }, queue)
}

/* *************************** rKit/bKit End *************************** */

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
const pListdir = exclusiveProxy(_listDirs, { size: 50, name: 'listdir' })

export async function listDirs (path, args) {
  return pListdir([...args, path])
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
  console.log(`Enqueued bash dkit.sh for ${path} with args`, args)
  const fullargs = ['--no-recursive', '--dirs', ...args, path]
  const rsynclines = await enqueue2bash('./dkit.sh', fullargs, queue4Remote)
  return [...rsync2entry(rsynclines)]
}

const pDKit = exclusiveProxy(_dKit, { size: 50, name: 'dkit' })

const _invalidateCache = new InvalidateCache()

export async function dKit (path, args, invalidateCache = false) {
  if (invalidateCache === 5) {
    return pDKit(_invalidateCache, args, path)
  } else {
    return pDKit(args, path)
  }
}

/* ---------------------getVersions--------------------- */
const moment = require('moment')
moment.locale('en')
const regexVersion = /(?<snap>@GMT-(?<sdate>.+?))\s+have a last modifed version at (?<modifed>\d{4}[/]\d\d[/]\d{2}-\d\d:\d\d:\d\d)/

// The bash script versions.sh can take a lot of time finish.
// So is better to use a dedicated queue

const qGetVersions = new QueueByKey()

function* matchVersion (lines) {
  for (const line of lines) {
    console.log('Get version:', line)
    const match = line.match(regexVersion)
    if (match) {
      const { groups: { snap, sdate, modifed } } = match || { groups: {} }
      // @GMT-2020.02.13-19.45.12
      const date = moment.utc(sdate, 'YYYY.MM.DD-HH.mm.ss').local().format('YYYY-MM-DD HH:mm')
      yield { snap, date, modifed }
    }
  }
}

async function _getVersions (path, ...args) {
  const lines = await enqueue2bash('./versions.sh', [...args, path].flat(), qGetVersions)
  return [...matchVersion(lines)]
}

// Proxy getVersions to cache the (already matched) results
const pGetVersions = exclusiveProxy(_getVersions, { size: 50, name: 'listdir' })

export async function getVersions (path, ...args) {
  return pGetVersions(path, args)
}

/* *************************** A 2nd-level queue *************************** */
// We want somethinh near to the high level caller,
// in order to dismiss previous request for the same path and same RVID but a different snap
// The idea is to discard unfinished requests for previous snaps

const listdirQueue = new QueueLast()
const dkitQueue = new QueueLast()

export async function listDir4Snap (path, snap, rvid, {
  args = [],
  queue = listdirQueue
} = {}) {
  const key = rvid + path + args.join('')
  args = [`--rvid=${rvid}`, ...args]
  if (snap) args.push(`--snap=${snap}`)
  const promise = () => listDirs(path, args) // A future promise as required by queue.enqueue
  return queue.enqueue(promise, key, snap)
}

export async function diffList4Snap (path, snap, {
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
    return queue.enqueue(promise, key, snap)
  }
}

// Functions for dealing with situation where we want to ignore previous request.
// Only the last request is important. Dismiss the previous ones

const queue4last = new QueueLast()

export async function listLastDir (path, snap, rvid, {
  args = [],
  queue = queue4last
} = {}) {
  const key = 'listLastDir'
  args = [`--rvid=${rvid}`, ...args]
  if (snap) args.push(`--snap=${snap}`)
  const promise = () => listDirs(path, args) // A future promise as required by queue.enqueue
  return queue.enqueue(promise, key, snap)
}

export async function diffLastDir (path, snap, {
  args = [],
  queue = queue4last,
  invalidateCache = false
} = {}) {
  const key = 'diffLastDir'
  if (snap) args.push(`--snap=${snap}`)
  if (invalidateCache) {
    // In this case it needs to go directly to the proxy/cache to invalidade it
    // Otherwise this may be canceled by a future request
    return dKit(path, args)
  } else {
    const promise = () => dKit(path, args) // A future promise as required by queue.enqueue
    return queue.enqueue(promise, key, snap)
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
