export function server (state) {
  return state.server.address
}
export function serverURL (state) {
  return `http://${state.server.address}:${state.server.hport}`
}
