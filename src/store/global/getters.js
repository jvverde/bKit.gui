export function account (state) {
  return currentAccount(state) || {}
}
export function currentAuthorized (state) {
  return state.accounts.filter(s => s.autorized === true)
}
export function currentProfiles (state) {
  return state.accounts.filter(s => s.profile === true)
}
export function currentAccount (state) {
  return state.accounts.filter(s => s.current === true)[0]
}
export function serverAddresses (state) {
  return [...new Set(state.accounts.map(s => s.servername))]
}
export function serverNames (state) {
  return serverAddresses(state)
}
export function serverName (state) {
  return (currentAccount(state) || {}).servername
}
export function accountName (state) {
  const account = currentAccount(state)
  return account ? `${account.user}@${account.servername}` : undefined
}
export function getAccount (state) {
  return (servername, user) => {
    return state.accounts.filter(s => s.servername === servername && s.user === user)[0]
  }
}
export function getAccountsByServername (state) {
  return (name) => {
    return state.accounts.filter(s => s.servername === name)
  }
}
export function getServerURL (state) {
  return (name) => {
    const server = state.accounts.filter(s => s.servername === name)[0] || { servername: name, hport: 8765 }
    return `http://${server.servername}:${server.hport}`
  }
}
