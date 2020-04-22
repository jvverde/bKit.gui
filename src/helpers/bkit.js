// let wsList = {}
'use strict'
import { bash, asyncInvokeBash } from './bash'
import { Store } from 'src/store'

const path = require('path')
const nill = () => null
const server = () => Store.getters['global/server']
// asyncInvokeBash('./listdisks.sh', [])
//  .then(disk => console.log('RVID:', disk))

/* ------------------ define queues and proxis/caches --------------- */
import Queue, { QueueLast, QueueByKey } from './queue'
const queue4Remote = new QueueByKey() // This is intend to queue remote request
const queue4Local = new QueueByKey() // This is intend to queue local request
const defaultQueue = new QueueByKey() // To be used for everything else
import { exclusiveProxy, invalidateCacheObj } from './proxy' // Get an exclusive proxy as well a invalidate cache object

// Enqueue bash scripts
export function enqueue2bash (name, args = [], events = {}, queue = defaultQueue) {
  if (events instanceof Queue) {
    queue = events
    events = {}
  }
  const key = [name, ...args, server()].join('|')
  // console.log('Key for enqueue2bash', key)
  return queue.enqueue(() => asyncInvokeBash(name, args, events), key)
}

// Proxy (via to Queue) to Bash
const proxy2Q2bash = exclusiveProxy(enqueue2bash, { size: 50, name: 'bash' })

export async function listDisksOnBackup () {
  return await proxy2Q2bash('./listdisks.sh', [], queue4Remote) || []
}

export async function listLocalDisks () {
  return await enqueue2bash('./lib/getdevs.sh', [], queue4Local) || []
}

export async function getDiskName (uuid) {
  return enqueue2bash('./lib/getdev.sh', [uuid], queue4Local)
}

export async function getServer () {
  const servers = await enqueue2bash('./server.sh')
  return servers[0]
}
export async function changeServer (server) {
  const servers = await enqueue2bash('./server.sh', ['-s', server])
  return servers[0]
}
export async function listServers () {
  return enqueue2bash('./listservers.sh')
}

export async function getSize (path) {
  const r = await enqueue2bash('bash.sh', ['du', '-s', path], queue4Local) || []
  return r.join('').replace(/(\d+)\s+.+$/, '$1')
}

export async function findFiles (path, ...args) {
  return enqueue2bash('bash.sh', ['find', path, ...args], queue4Local)
}

export async function countFiles (path, ...args) {
  let cnt = 0
  const onreadline = () => cnt++
  return enqueue2bash('bash.sh', ['find', path, ...args], { onreadline }, queue4Local).then(() => cnt)
}

export async function createTask (...args) {
  return enqueue2bash('./ctask.sh', args, queue4Local)
}

/* *************************** rKit/bKit *************************** */
const restoreQueue = new Queue() // Dedicated queue for restore requests
const backupQueue = new Queue() // Dedicated queue for restore requests
// Enqueue  scripts
function _Queue (name, args, events = {}, queue = restoreQueue) {
  const { enqueued = nill } = events
  const key = Date.now() + Math.random().toString(36).slice(1) + server()
  enqueued({
    dismiss: () => queue.dismiss(key),
    position: () => queue.position(key)
  })
  const promise = queue.enqueue(() => asyncInvokeBash(name, args, events), key)
  return promise
}

function _kit (scriptname, path, params = {}) {
  console.log('Enqueue', scriptname)

  const {
    options = [],
    rsyncoptions = [],
    onreadline = nill,
    queue = new Queue(),
    ...events
  } = params

  const args = [
    ...options,
    '--', // now rsync options
    ...rsyncoptions,
    // '--dry-run', // TEMPORÁRIO SÓ PARA TESTES
    path
  ]

  return _Queue(scriptname, args, { ...events, onreadline }, queue)
}

/* ---------------------rkit--------------------- */
export function rKit (path, options, rsyncoptions, events) {
  const specificOptions = [
    // '--no-A', '--no-g', '--no-p',
    // '--delay-updates', // if we want to receive a file list ahead
    '--progress',
    '--info=PROGRESS2,STATS2,NAME2'
  ]
  const onreadline = matchLine4rKit(events)
  return _kit('./rkit.sh', path, {
    options,
    rsyncoptions: [...rsyncoptions, ...specificOptions],
    ...events,
    onreadline,
    queue: restoreQueue
  })
}

// Match Line for rkit => invoke handlers
function matchLine4rKit (events = {}) {
  const {
    onstart = nill,
    onfinish = nill,
    onrecvfile = nill,
    ontotalfiles = nill,
    ontotalsize = nill,
    onprogress = nill
  } = events

  const regexs = [
    {
      re: /^rKit\s*\[(?<pid>\d+):(?<pgid>\d*)\]\s*:\s*Start\s*Restore/,
      handler: (match, line) => onstart(match.groups, line)
    },
    {
      re: /^rKit\s*\[\d+:\d*\]\s*:\s*Done/,
      handler: onfinish
    },
    {
      // "recv|.f         |README.TXT|2001/10/28-17:18:28|0|6770|2020/04/10 16:58:50"
      // itemize format (%i): YXcstpoguax
      re: /^"recv\|(?<Y>.)(?<X>.)(?<cstpoguax>[^|]+)\|(?<file>[^|]+)\|([^|]+)\|(?<bytes>[^|]+)\|(?<size>[^|]+)\|.*"$/,
      handler: (match, line) => onrecvfile(match.groups, line)
    },
    {
      re: /^\s*(?<nfiles>\d+)\s+files/,
      handler: (match) => ontotalfiles(match.groups.nfiles)
    },
    {
      re: /^total size is (?<size>.+?)\s/,
      handler: (match) => ontotalsize(match.groups.size)
    },
    {
      re: /\s*(?<size>[0-9.mkgb]+)\s+(?<percent>[0-9]+)%\s+(?<rate>[0-9.mkgb/s]+)/i,
      handler: (match) => onprogress(match.groups)
    }
  ]
  return (line) => {
    console.info('rKit line:', line)
    for (const elem of regexs) {
      const result = line.match(elem.re)
      if (result) {
        elem.handler(result, line)
        break
      }
    }
  }
}

/* ---------------------bKit--------------------- */
export function bKit (path, params = {}) {
  // rsyncoptions.push('--dry-run')
  const { options = [], rsyncoptions = [], ...extra } = params
  const events = matchLine4bKit(extra)
  return _kit('./bkit.sh', path, {
    options,
    rsyncoptions,
    queue: backupQueue,
    ...events
  })
}

function matchLine4bKit (events = {}) {
  const {
    start = nill,
    sent = nill,
    newphase = nill,
    done = nill,
    ...extra
  } = events

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
      handler: (match, line) => {
        // tmp/tmp.4pjM5dnMab.bkit.backup/manifest.36018
        if (match.groups.file.match(/tmp\/tmp\..+\.bkit\.backup\/manifest\.\d+/)) return
        sent(match.groups, match, line)
      }
    }, {
      // Phase 1 - Backup new/modified files
      re: /^Phase\b\s*(?<phase>\b[^\s]*?\b)\s*-\s*(?<msg>.*$)/,
      handler: match => newphase(match.groups, match)
    }, {
      re: /^bKit\s*\[\d+:\d*\]\s*:\s*Done/,
      handler: done
    }, {
      re: /^bKit\s*\[(?<pid>\d+):(?<pgid>\d*)\]\s*:\s*Start\s*backup/,
      handler: match => start(match.groups, match)
    }
  ]

  const onreadline = (data) => {
    console.info('bKit line:', data)
    for (const elem of regexs) {
      const result = data.match(elem.re)
      if (result) {
        elem.handler(result, data)
        break
      }
    }
  }

  return { ...extra, onreadline }
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

async function _listDirs (args, events = {}) {
  console.log('Enqueued bash listdir.sh with args', args)
  const lines = await enqueue2bash('./listdirs.sh', args, events, queue4Remote)
  return [...line2entry(lines)]
}

// Proxy listdir to cache the (already matched) results
const pListdir = exclusiveProxy(_listDirs, { size: 50, name: 'listdir' })

export async function listDirs (path, args) {
  const stderr = (err) => {
    // rsync: change_dir "/C.2689075C.OS.3.NTFS/.snapshots/@GMT-2020.04.02-14.07.41/data/.TESTE/z2" (in SRPT.WIN10.0586AEB1-C5C9-4790-95FE-4591160EE0FA.user.jvv) failed: No such file or directory
    console.warn(`Listdir Error: ${err}`)
    const error = `${err}`
    const match = error.match(/rsync: change_dir ".+" \(in .+\) failed: No such file or directory/)
    if (match) return 'stop'
    else return undefined
  }
  return pListdir([...args, path], { stderr })
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

async function _dKit (path, ...args) {
  console.log(`Enqueued bash dkit.sh for ${path} with args`, args)
  const fullargs = ['--no-recursive', '--dirs', ...args, path]
  const rsynclines = await enqueue2bash('./dkit.sh', fullargs, queue4Remote)
  return [...rsync2entry(rsynclines)]
}

const pDKit = exclusiveProxy(_dKit, { size: 50, name: 'dkit' })

export async function dKit (path, args, { invalidateCache = false } = {}) {
  if (invalidateCache) {
    return pDKit(path, ...args, invalidateCacheObj)
  } else {
    return pDKit(path, ...args)
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

/* ---------------------listSnaps--------------------- */
const qListSnaps = new QueueByKey()
export async function listSnaps (rvid, events = {}) {
  const { stderr = (err) => {
    // rsync: link_stat "/C.2689075C.OS.3.NTFS/.snapshots/@GMT-*" (in SRPT.WIN10.0586AEB1-C5C9-4790-95FE-4591160EE0FA.user.jvv) failed: No such file or directory (2)
    console.warn(`listSnaps Error: ${err}`)
    const error = `${err}`
    const match = error.match(/rsync: link_stat ".+" \(in .+\) failed: No such file or directory/)
    if (match) return 'stop'
    else return undefined
  } } = events
  return enqueue2bash('./listsnaps.sh', [`--rvid=${rvid}`], { ...events, stderr }, qListSnaps)
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
  const key = rvid + path + args.join('') + server()
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
  const key = path + args.join('') + server()
  if (snap) args.push(`--snap=${snap}`)
  if (invalidateCache) {
    // In this case it needs to go directly to the proxy/cache to invalidade it
    // Otherwise this may be canceled by a future request
    return dKit(path, args, { invalidateCache })
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
  const key = 'diffLastDir' + server()
  if (snap) args.push(`--snap=${snap}`)
  if (invalidateCache) {
    // In this case it needs to go directly to the proxy/cache to invalidade it
    // Otherwise this may be canceled by a future request
    return dKit(path, args, { invalidateCache })
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
