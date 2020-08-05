export function server (state) {
  return state.server.address
}
export function serverAddress (state) {
  return state.server.address
}
export function servers (state) {
  return state.servers
}
export function serverURL (state) {
  return `http://${state.server.address}:${state.server.hport}`
}
