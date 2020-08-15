import { ipcRenderer } from 'electron'

export const getAccounts = async () => {
  const credentials = ipcRenderer.sendSync('findCredentials')
  return credentials.map(c => c.account)
}
export const deleteAccount = async (name) => {
  return ipcRenderer.sendSync('deletePassword', name)
}
export const addAccount = async (name, pass) => {
  return ipcRenderer.sendSync('setPassword', name, pass)
}
export const getPassword = async (name) => {
  return ipcRenderer.sendSync('getPassword', name)
}
