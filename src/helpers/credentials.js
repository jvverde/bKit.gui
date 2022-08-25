export const getAccounts = async () => {
  // const credentials = await ipcRenderer.invoke('findCredentials') || []
  const credentials = await window.electron.credentials.find() || []
  return credentials.map(c => c.account)
}
export const deleteAccount = async (name) => {
  // return ipcRenderer.invoke('deletePassword', name)
  return window.electron.credentials.remove(name)
}
export const addAccount = async (name, pass) => {
  // return ipcRenderer.invoke('setPassword', name, pass)
  return window.electron.credentials.set(name, pass)
}
export const getPassword = async (name) => {
  // return ipcRenderer.invoke('getPassword', name)
  return window.electron.credentials.get(name)
}
