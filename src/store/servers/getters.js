export function currentServer (state) {
  return state.servers.filter(s => s.current === true)[0]
}

export function serversName (state) {
  return [...new Set(state.servers.map(s => s.name))]
}

export function serversURL (state) {
  return [...new Set(state.servers.map(s => s.url))]
}

export function servers (state) {
  return state.servers
}

/* Getters for current server */
export function server (state) {
  return currentServer(state) || {}
}

export function serverName (state) {
  return server(state).name
}

export function serverURL (state) {
  return server(state).url
}

/* Getters for a given Name or URL */

export function getServerURL (state) {
  return (name = serverName(state)) => {
    const server = state.servers.filter(s => s.name === name)[0] || { }
    return server.url
  }
}

export function getServerName (state) {
  return (url = serverURL(state)) => {
    const server = state.servers.filter(s => s.url === url)[0] || { }
    return server.name
  }
}

export function getServersByName (state) {
  return (name = serverName(state)) => {
    return state.servers.filter(s => s.name === name)
  }
}

export function getServerByUrl (state) {
  return url => {
    return state.servers.filter(s => s.url === url)[0]
  }
}

/* Getters for a given PARAMETERS */

export const getServerOf = (state) => server => {
  const keys = Object.keys(server)
  return state.servers.filter(s => keys.every(k => s[k] === server[k]))[0]
}
