import { ipcRenderer } from 'electron'

export const getPreferences = async () => {
  return ipcRenderer.sendSync('getPreferences')
}

export const setPreferences = async (p) => {
  return ipcRenderer.sendSync('setPreferences', p)
}
