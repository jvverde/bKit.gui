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
export function serverAddress (state) {
  return state.selectedServer.address
}
export function serverURL (state) {
  return `http://${state.selectedServer.address}:${state.selectedServer.hport}`
}
export function servers (state) {
  return state.servers
}
export function serverNames (state) {
  return state.servers.map(server => server.address)
}

export function getServerURL (state) {
  return (name) => {
    const index = state.servers.findIndex(s => s.address === name)
    if (index >= 0) {
      const server = state.servers[index]
      return `http://${server.address}:${server.hport}`
    } else return undefined
  }
}
