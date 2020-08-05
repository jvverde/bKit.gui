const makeServer = ({ address, hport = 8765, iport = 8760, bport = 8761, rport = 8762, uport = 8763 }) => {
  return {
    address,
    hport,
    iport,
    bport,
    rport,
    uport
  }
}

export function setServer (state, server) {
  if (typeof server !== 'object') server = { address: server }
  state.server = makeServer(server)
}

export function addServer (state, server) {
  if (typeof server !== 'object') server = { address: server }
  const index = state.servers.findIndex(s => s.address === server.address)
  if (index >= 0) {
    state.servers.splice(index, 1, makeServer(server))
  } else {
    state.servers.push(makeServer(server))
  }
}

export function addServers (state, servers) {
  servers.forEach(server => addServer(state, server))
}
