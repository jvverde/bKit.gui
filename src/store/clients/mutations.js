export function setCurrentClient (state, client) {
  state.current = client
}

export function selectClient (state, client) {
  state.selected = client
}

export function setClients (state, list) {
  state.list = list
}
