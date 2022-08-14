import { ipcRenderer } from 'electron'

export const getAccounts = async () => {
  const credentials = await ipcRenderer.invoke('findCredentials') || []
  return credentials.map(c => c.account)
}
export const deleteAccount = async (name) => {
  return ipcRenderer.invoke('deletePassword', name)
}
export const addAccount = async (name, pass) => {
  return ipcRenderer.invoke('setPassword', name, pass)
}
export const getPassword = async (name) => {
  return ipcRenderer.invoke('getPassword', name)
}
