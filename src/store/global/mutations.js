const makeServer = ({
  address,
  section,
  user,
  hport = 8765,
  iport = 8760,
  bport = 8761,
  rport = 8762,
  uport = 8763,
  ...extra
}) => {
  return {
    address,
    user,
    section,
    hport,
    iport,
    bport,
    rport,
    uport,
    ...extra
  }
}

export function addServer (state, server) {
  if (!server || !server.address || !server.user) throw new Error("Server dont' have a field address or field user, or both")
  const index = state.servers.findIndex(s => s.address === server.address && s.user === server.user)
  if (index >= 0) {
    const newserver = { ...state.servers[index], ...makeServer(server) }
    state.servers.splice(index, 1, newserver)
  } else {
    state.servers.push(makeServer(server))
  }
}

export function delServer (state, server) {
  const index = state.servers.findIndex(s => s.address === server.address && s.user === server.user)
  if (index >= 0) {
    return state.servers.splice(index, 1)
  } else {
    return undefined
  }
}

export function addServers (state, servers) {
  servers.forEach(server => addServer(state, server))
}

export function setCurrentServer (state, server) {
  state.servers.filter(s => s.current).forEach(s => (s.current = false))
  addServer(state, { ...server, current: true })
}
