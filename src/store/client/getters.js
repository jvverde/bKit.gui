export function getClient (state) {
  return state.client
}

export function isCurrentClient (state) {
  const current = state.client || {}
  return ({ uuid, name, domain }) => uuid === current.uuid && domain === current.domain && name === current.name
}

export function isCurrenCientAndUser (state) {
  const current = state.client || {}
  return ({ uuid, name, domain, user }) => uuid === current.uuid && domain === current.domain && name === current.name && user === current.user
}

export function isCurrenUser (state) {
  const current = state.client || {}
  return user => user === current.user
}
