export function server (state) {
  return state.bkitserver.address
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

export function selectedServer (state) {
  return state.selectedServer
}

export function servers (state) {
  return state.servers
}
export function serverAddresses (state) {
  return [...new Set(state.servers.map(s => s.address))]
}
export function serverNames (state) {
  return serverAddresses(state)
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
