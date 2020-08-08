export function server (state) {
  return state.bkitserver.address
}
export function bkitAddress (state) {
  return state.bkitserver.address
}
export function bkitBPort (state) {
  return state.bkitserver.bport
}
export function bkitIPort (state) {
  return state.bkitserver.iport
}
export function selectedServer (state) {
  return state.selectedServer
}
export function serverAddress (state) {
  return state.selectedServer.address
}
export function serverURL (state) {
  return `http://${state.selectedServer.address}:${state.selectedServer.hport}`
}
export function servers (state) {
  return state.servers
}
