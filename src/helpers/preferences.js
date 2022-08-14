import { ipcRenderer } from 'electron'

export const getPreferences = async () => {
  return ipcRenderer.invoke('getPreferences')
}

export const setPreferences = async (p) => {
  return ipcRenderer.invoke('setPreferences', p)
}
