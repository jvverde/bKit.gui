import { error } from 'src/helpers/notify'

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

export function selectServer (state, server) {
  if (typeof server !== 'object') server = { address: server }
  const index = state.servers.findIndex(s => s.address === server.address)
  if (index >= 0) {
    state.selectedServer = state.servers[index]
  } else {
    error(`Server ${server.address} not found`)
    return {}
  }
}

export function setbkitServer (state, server) {
  if (typeof server !== 'object') server = { address: server }
  state.bkitserver = makeServer(server)
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
