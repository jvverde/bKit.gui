const uAccount = ({ // Uniformization
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

export function addAccount (state, server) {
  if (!server || !server.address || !('user' in server)) throw new Error("Server dont' have a field address or field user, or both")
  const index = state.accounts.findIndex(s => s.address === server.address && (s.user === server.user || !s.user))
  if (index >= 0) {
    const newserver = { ...state.accounts[index], ...uAccount(server) }
    state.accounts.splice(index, 1, newserver)
  } else {
    state.accounts.push(uAccount(server))
  }
}

export function delServer (state, server) {
  const index = state.accounts.findIndex(s => s.address === server.address && s.user === server.user)
  if (index >= 0) {
    return state.accounts.splice(index, 1)
  } else {
    return undefined
  }
}

export function addAccounts (state, servers) {
  servers.forEach(server => addAccount(state, server))
}

export function setCurrentServer (state, server) {
  state.accounts.filter(s => s.current).forEach(s => (s.current = false))
  addAccount(state, { ...server, current: true })
}
