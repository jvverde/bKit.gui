const uAccount = ({ // Uniformization
  name,
  serverURL,
  section,
  user,
  hport = 8765,
  sport = 8766,
  iport = 8760,
  bport = 8761,
  rport = 8762,
  uport = 8763,
  ...extra
}) => {
  if (!name && user) name = `${user}@${serverURL}`
  return {
    name,
    serverURL,
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

export function addAccount (state, account) {
  if (!account || !account.serverURL || !('user' in account)) throw new Error("Account doesn't have a field 'serverURL' or field 'user', or both")
  account = uAccount(account)
  const index = state.accounts.findIndex(s => s.serverURL === account.serverURL && (s.user === account.user || !s.user))
  if (index >= 0) {
    const newaccount = { ...state.accounts[index], ...account }
    state.accounts.splice(index, 1, newaccount)
  } else {
    state.accounts.push(uAccount(account))
  }
}

export const updateAccount = addAccount

export function delAccount (state, account) {
  const index = state.accounts.findIndex(s => s.serverURL === account.serverURL && s.user === account.user)
  if (index >= 0) {
    return state.accounts.splice(index, 1)
  } else {
    return undefined
  }
}

export function addAccounts (state, accounts) {
  accounts.forEach(account => addAccount(state, account))
}

export const updateAccounts = addAccounts

export function setCurrentAccount (state, account) {
  state.accounts.filter(s => s.current).forEach(s => (s.current = false)) // Reset any current account
  addAccount(state, { ...account, current: true })
}
