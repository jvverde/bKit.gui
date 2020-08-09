import { error } from 'src/helpers/notify'

const makeServer = ({
  address,
  section,
  account,
  hport = 8765,
  iport = 8760,
  bport = 8761,
  rport = 8762,
  uport = 8763,
  ...extra
}) => {
  return {
    address,
    account,
    section,
    hport,
    iport,
    bport,
    rport,
    uport,
    ...extra
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
  const index = state.servers.findIndex(s => s.address === server.address && s.account === server.account)
  if (index >= 0) {
    const newserver = { ...state.servers[index], ...makeServer(server) }
    state.servers.splice(index, 1, newserver)
  } else {
    state.servers.push(makeServer(server))
  }
}

export function addServers (state, servers) {
  servers.forEach(server => addServer(state, server))
}
