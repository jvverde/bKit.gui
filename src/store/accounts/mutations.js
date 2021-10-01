const urlre = new RegExp('https?://([^:]+):[0-9]+')
const uAccount = ({ // Uniformization
  name,
  servername,
  serverURL,
  section,
  user,
  profile,
  hport = 8765,
  sport = 8766,
  iport = 8760,
  bport = 8761,
  rport = 8762,
  uport = 8763,
  ...extra
}) => {
  if (!serverURL && !servername) throw new Error("Account doesn't have a field 'serverURL' nor 'servername'")
  if (!user) throw new Error("Account doesn't have a field 'user'")
  serverURL = serverURL || `http://${servername}:${hport}`
  servername = servername || serverURL.replace(urlre, '$1')
  name = name || `${user}@${serverURL}`
  return {
    name,
    servername,
    serverURL,
    user,
    section,
    profile,
    hport,
    iport,
    bport,
    rport,
    uport,
    ...extra
  }
}

export function addAccount (state, account) {
  // account = uAccount(account) => DONT do that here. You ruin the newaccount construction bellow
  const index = state.accounts.findIndex(s => s.serverURL === account.serverURL && s.user === account.user)
  if (index >= 0) {
    const newaccount = { ...state.accounts[index], ...account }
    console.log('update account', newaccount)
    state.accounts.splice(index, 1, uAccount(newaccount))
  } else {
    console.log('add account', account.name, account)
    state.accounts.push(uAccount(account))
  }
}

export const updateAccount = addAccount

export function delAccount (state, account) {
  const index = state.accounts.findIndex(s => s.name === account.name)
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
  updateAccount(state, { ...account, current: true })
}
