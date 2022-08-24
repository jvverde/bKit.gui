const { contextBridge, ipcRenderer } = require('electron')

const openShell = async () => await ipcRenderer.invoke('openShell')
const os = async () => await ipcRenderer.invoke('os')
const killtree = async (pid) => await ipcRenderer.invoke('killtree')
let count = 0

contextBridge.exposeInMainWorld('electron', {
  openShell,
  os,
  killtree,
  bash: async (name, args = [], events = {}) => {
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
})
