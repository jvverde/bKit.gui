export function getCurrentClient (state) {
  return state.current
}
export function getClients (state) {
  return state.list
}

export function isCurrentClient (state) {
  const current = state.current || {}
  return ({ uuid, name, domain }) => uuid === current.uuid && domain === current.domain && name === current.name
}

export function isCurrenCientAndUser (state) {
  const current = state.current || {}
  return ({ uuid, name, domain, user }) => uuid === current.uuid && domain === current.domain && name === current.name && user === current.user
}

export function isCurrenUser (state) {
  const current = state.current || {}
  return user => user === current.user
}
