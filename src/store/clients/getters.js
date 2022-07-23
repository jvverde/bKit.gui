export function getCurrentClient (state) {
  return state.current
}
export function getSelectedClient (state) {
  return state.selected
}
export function getClients (state) {
  return state.list
}
export function isCurrentClient (state) {
  const current = state.current || {}
  return ({ uuid, name, domain, user }) => uuid === current.uuid && domain === current.domain && name === current.name && user === current.user
}

export function isSelectedClient (state) {
  const selected = state.selected || {}
  return ({ uuid, name, domain, user }) => uuid === selected.uuid && domain === selected.domain && name === selected.name && user === selected.user
}

export function isCurrenUser (state) {
  const current = state.current || {}
  return user => user === current.user
}
