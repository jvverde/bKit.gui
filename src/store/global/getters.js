export function server (state) {
  return currentServer(state) || {}
}

export function servers (state) {
  return state.accounts
}
export function serversWithCred (state) {
  return state.accounts.filter(s => s.credentials === true)
}
export function serversInitialized (state) {
  return state.accounts.filter(s => s.initialized === true)
}

export function currentServer (state) {
  return state.accounts.filter(s => s.current === true)[0]
}

export function serverAddresses (state) {
  return [...new Set(state.accounts.map(s => s.address))]
}
export function serverNames (state) {
  return serverAddresses(state)
}

export function getAccount (state) {
  return (address, user) => {
    return state.accounts.filter(s => s.address === address && s.user === user)[0]
  }
}
export function getAccountsByServer (state) {
  return (name) => {
    return state.accounts.filter(s => s.address === name)
  }
}

export function getAccountNames (state) {
  return (name) => {
    return state.accounts.filter(s => s.address === name)
      .map(s => s.account)
  }
}

export function getServerURL (state) {
  return (name) => {
    const server = state.accounts.filter(s => s.address === name)[0] || { address: name, hport: 8765 }
    return `http://${server.address}:${server.hport}`
  }
}
