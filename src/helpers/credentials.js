import { ipcRenderer } from 'electron'

export const getAccounts = async () => {
  const credentials = ipcRenderer.sendSync('findCredentials')
  return credentials.map(c => c.account)
}
export const deleteAccount = async (name) => {
  return ipcRenderer.sendSync('deletePassword', name)
}
export const addAccount = async (name, pass) => {
  ipcRenderer.send('setPassword', name, pass)
}
