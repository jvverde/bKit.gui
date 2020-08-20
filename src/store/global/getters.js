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
  return [...new Set(state.accounts.map(s => s.address))]
}
export function serverNames (state) {
  return serverAddresses(state)
}
export function serverName (state) {
  return (currentAccount(state) || {}).address
}
export function accountName (state) {
  const account = currentAccount(state)
  return account ? `${account.user}@${account.address}` : undefined
}
export function getAccount (state) {
  return (address, user) => {
    return state.accounts.filter(s => s.address === address && s.user === user)[0]
  }
}
export function getAccountsByServername (state) {
  return (name) => {
    return state.accounts.filter(s => s.address === name)
  }
}
export function getServerURL (state) {
  return (name) => {
    const server = state.accounts.filter(s => s.address === name)[0] || { address: name, hport: 8765 }
    return `http://${server.address}:${server.hport}`
  }
}
