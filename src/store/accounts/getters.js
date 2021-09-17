export function currentAccount (state) {
  return state.accounts.filter(s => s.current === true)[0]
}
export function account (state) {
  return currentAccount(state) || {}
}
export function currentAuthorized (state) {
  return state.accounts.filter(s => s.autorized === true)
}
export function currentProfiles (state) {
  return state.accounts.filter(s => s.profile === true)
}

export function servers (state) {
  return state.accounts.map(s => s.serverURL)
}

export function accountName (state) {
  const account = currentAccount(state) || {}
  return account.name
}
export function accountServerURL (state) {
  const account = currentAccount(state) || {}
  return account.serverURL
}

export function getAccount (state) {
  return (name) => {
    return state.accounts.filter(s => s.name === name)[0]
  }
}
export function getAccountsByServerURL (state) {
  return (url) => {
    return state.accounts.filter(s => s.serverURL === url)
  }
}
