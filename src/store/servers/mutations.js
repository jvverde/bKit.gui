const uServer = ({ // Uniformization
  servername,
  hport = 8765,
  sport = 8766,
  iport = 8760,
  bport = 8761,
  rport = 8762,
  uport = 8763,
  proto = 'https',
  ...extra
}) => {
  return {
    servername,
    hport,
    iport,
    bport,
    rport,
    uport,
    proto,
    ...extra
  }
}

export function addServer (state, server) {
  if (!server || !server.servername) throw new Error("Server doesn't have a field 'servername'")
  const index = state.servers.findIndex(s => s.servername === server.servername)
  if (index >= 0) {
    const newserver = { ...state.servers[index], ...uServer(server) }
    state.servers.splice(index, 1, newserver)
  } else {
    state.servers.push(uServer(server))
  }
}

export const updateServer = addServer

export function delServer (state, server) {
  const index = state.servers.findIndex(s => s.servername === server.servername)
  if (index >= 0) {
    return state.servers.splice(index, 1)
  } else {
    return undefined
  }
}

export function addServers (state, servers) {
  servers.forEach(server => addServer(state, server))
}

export const updateServers = addServers

export function setCurrentServer (state, server) {
  state.servers.filter(s => s.current).forEach(s => (s.current = false)) // Reset any current server
  addServer(state, { ...server, current: true })
}
