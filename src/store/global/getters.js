export function server (state) {
  return currentServer(state) || {}
}
export function bkitAddress (state) {
  return state.bkitserver.address
}
export function bkitBPort (state) {
  return state.bkitserver.bport
}
export function bkitIPort (state) {
  return state.bkitserver.iport
}

export function servers (state) {
  return state.servers
}
export function serversWithCred (state) {
  return state.servers.filter(s => s.credentials === true)
}
export function serversInitialized (state) {
  return state.servers.filter(s => s.initialized === true)
}

export function currentServer (state) {
  return state.servers.filter(s => s.current === true)[0]
}

export function serverAddresses (state) {
  return [...new Set(state.servers.map(s => s.address))]
}
export function serverNames (state) {
  return serverAddresses(state)
}

export function getAccount (state) {
  return (address, user) => {
    return state.servers.filter(s => s.address === address && s.user === user)[0]
  }
}
export function getAccountsByServer (state) {
  return (name) => {
    return state.servers.filter(s => s.address === name)
  }
}

export function getAccountNames (state) {
  return (name) => {
    return state.servers.filter(s => s.address === name)
      .map(s => s.account)
  }
}

export function getServerURL (state) {
  return (name) => {
    const server = state.servers.filter(s => s.address === name)[0] || { address: name, hport: 8765 }
    return `http://${server.address}:${server.hport}`
  }
}
