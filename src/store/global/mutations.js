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

export function selectServer (state, servername) {
  state.selectedServer = servername
}

export function setbkitServer (state, server) {
  if (typeof server !== 'object') server = { address: server }
  state.bkitserver = makeServer(server)
}

export function addServer (state, server) {
  if (typeof server !== 'object') server = { address: server }
  const index = state.servers.findIndex(s => s.address === server.address && s.user === server.user)
  if (index >= 0) {
    const newserver = { ...state.servers[index], ...makeServer(server) }
    state.servers.splice(index, 1, newserver)
    console.log('updateServer', state.servers[index])
  } else {
    state.servers.push(makeServer(server))
    console.log('addServer', state.servers.slice(-1)[0])
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
