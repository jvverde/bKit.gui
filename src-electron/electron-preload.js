const { contextBridge, ipcRenderer } = require('electron')

const openShell = async () => await ipcRenderer.invoke('openShell')
const os = async () => await ipcRenderer.invoke('os')
const killtree = async (pid) => await ipcRenderer.invoke('killtree', pid)
const debug = () => ipcRenderer.send('switchdebug')

let count = 0
const bash = async (name, args = [], events = {}) => {
  const index = count++
  const keys = Object.keys(events)
  keys.forEach(e => {
    ipcRenderer.on(`${e}.${index}`, (event, ...args) => {
      console.log(`Called event ${e}.${index} with`, ...args)
      events[e](...args)
    })
  })
  const result = await ipcRenderer.invoke('bash', name, args, keys, index)
  keys.forEach(e => ipcRenderer.removeAllListeners(`${e}.${index}`))
  return result
}
   
const credentials = {
  find: async () => await ipcRenderer.invoke('findCredentials'),
  remove: async (name) => await ipcRenderer.invoke('deletePassword', name),
  get: async (name) => await ipcRenderer.invoke('getPassword', name),
  set: async (name, pass) => await ipcRenderer.invoke('setPassword', name, pass)
}

const path = {
  relative: (...args) => ipcRenderer.sendSync('usepath', 'relative', ...args),
  normalize: (...args) => ipcRenderer.sendSync('usepath', 'relative', ...args),
  sep: ipcRenderer.sendSync('usepath', 'sep'),
  posix: ipcRenderer.sendSync('usepath', 'posix'),
  resolve: (...args) => ipcRenderer.sendSync('usepath', 'resolve', ...args),
  join: (...args) => ipcRenderer.sendSync('usepath', 'join', ...args)
}

const secrets = {
  encrypt: (...args) => ipcRenderer.sendSync('encrypt', ...args),
  decrypt:  (...args) => ipcRenderer.sendSync('decrypt', ...args),
  hmac:  (...args) => ipcRenderer.sendSync('hmac', ...args),
  hash:  (...args) => ipcRenderer.sendSync('hash', ...args)
}

contextBridge.exposeInMainWorld('electron', {
  openShell,
  os,
  killtree,
  bash,
  debug,
  credentials,
  path,
  secrets
})
