import { app } from 'electron'
import say from '../utils/say'
import chokidar from 'chokidar'

const chokidarOptions = {
  depth: 0,
  useFsEvents: false,
  ignoreInitial: true,
  followSymlinks: false,
  ignored: ['.before-restore-on*', 'pagefile.sys', 'swapfile.sys', 'System Volume Information'],
  atomic: true,
  ignorePermissionErrors: true,
  persistent: true
}

const watchers = {}
const nill = () => false
let cnt = 1 // Don't use 0 

export function install (fullpath, callback = nill) {
  if (!fullpath) return
  try {
    if (watchers[fullpath]) {
      say.log('Add a new callback for', fullpath)
      const id = cnt++
      watchers[fullpath].callbacks.push({
        f: callback,
        id
      })
      return id
    } else {
      say.log('Start Watcher', fullpath)
      const watcher =  chokidar.watch(fullpath, chokidarOptions)
      const id = cnt++
      watchers[fullpath] = {
        watcher,
        callbacks: [{
          f: callback,
          id
        }]
      }
      watcher
        .on('all', (event, path) => {
          const diskEvent = [event, path].join('|')
          console.log('Event', diskEvent)
          watchers[fullpath].callbacks.forEach(c => c.f({ event, path, diskEvent }))
        })
        .on('error', error => say.warn(`Watcher error: ${error} on path ${fullpath}`, false))
      return id
    }
  } catch (err) {
    say.error(err)
    throw err
  }
}

export async function remove (fullpath, id) {
  const entry = watchers[fullpath]
  if (!entry) throw new Error(`There are no watchers for ${fullpath}`)
  const callbacks = entry.callbacks
  const i = callbacks.findIndex(c => c.id === id)
  if (i >= 0) callbacks.splice(i, 1)
  if (callbacks.length <= 0) {
    await entry.watcher.close()
    delete watchers[fullpath] 
  }
}

app.on('before-quit', () => {
  Object.keys(watchers).forEach((k, v) => {
    try {
      v.watcher.close()
    } catch (e) {
      say.warn(e)
    }
  })  
})