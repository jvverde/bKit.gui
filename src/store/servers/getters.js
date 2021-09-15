const getURL = ({ proto = 'https', hport = 8765, servername }) => `${proto}://${servername}:${hport}`

export function currentServer (state) {
  return state.servers.filter(s => s.current === true)[0]
}

export function serversName (state) {
  return [...new Set(state.servers.map(s => s.servername))]
}

export function serversURL (state) {
  return [...new Set(state.servers.map(s => getURL(s)))]
}

export function servers (state) {
  return state.servers
}

/* Getters for current server */
export function server (state) {
  return currentServer(state) || {}
}

export function serverName (state) {
  return server(state).servername
}

export function serverURL (state) {
  const cServer = server(state)
  return getURL(cServer)
}

/* Getters for a given servername */

export function getServerURL (state) {
  return (name = serverName(state)) => {
    const server = state.servers.filter(s => s.servername === name)[0] || { servername: name }
    return getURL(server)
  }
}

export function getServer (state) {
  return (servername = serverName(state)) => {
    return state.servers.filter(s => s.servername === servername)[0]
  }
}

export function getServersByName (state) {
  return (name) => {
    return state.servers.filter(s => s.servername === name)
  }
}
