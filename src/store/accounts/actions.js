/*
export function someAction (context) {
}
*/
import { getAccounts as getCredentials, addAccount as addCredentials, deleteAccount as deleteCredentials, getPassword } from 'src/helpers/credentials'

export async function addAccount ({ commit, getters }, { user, serverURL, password }) {
  try {
    const name = `${user}@${serverURL}`
    const account = { serverURL, user, name, autorized: true }
    console.info('Add account', account)
    commit('addAccount', account)
    await addCredentials(name, password)
    return getters.getAccountsOf(account)[0] // Resolve to same account but full updated
  } catch (err) {
    console.warn(err)
    throw err
  }
}

export async function removeCredentials ({ commit, getters }, account) {
  try {
    await deleteCredentials(account.name)
    const unAuthAccount = { ...account, autorized: false }
    commit('updateAccount', unAuthAccount)
    return getters.getAccountsOf({ autorized: false }) // Resolve to all not authorized accounts
  } catch (err) {
    console.warn(err)
    throw err
  }
}

// const re = new RegExp('^(?<schema>https?)://(?<servername>[^:]+)(:(?<port>[0-9]+)?)')
const regex = /^https/i

export async function loadCredentials ({ commit, getters }) {
  try {
    const credentials = await getCredentials()
    console.log('[loadCredentials]', credentials)
    const accounts = credentials.map(name => {
      console.info('Found credentials for:', name)
      const [user, serverURL] = name.split('@')
      const secure = regex.test(serverURL)
      const [schema, servername, port] = serverURL.split(/:[/]{2}|:/)
      return { name, serverURL, user, autorized: true, secure, schema, servername, port }
    })
    commit('updateAccounts', accounts)
    return getters.getAccountsOf({ autorized: true }) // Resolve to all authorized accounts
  } catch (err) {
    console.warn(err)
    throw err
  }
}

/* Operations related with accounts defined on filesystem on ETCDIR */
import { listServers, getServer, changeServer, deleteServer, initServer } from 'src/helpers/bkit'

const parseAccount = (line, profile = true) => {
  if (!line) return {}
  const [user, url] = line.split('@')
  const [servername, , section, iport, bport, rport, uport, hport, sport] = url.split(':')
  const serverURL = `http://${servername}:${hport}`
  const name = `${user}@${serverURL}`
  return { name, serverURL, servername, user, section, iport, bport, rport, uport, hport, sport, profile }
}

export async function loadAccounts ({ commit, getters }) {
  try {
    const serversList = await listServers('-f')
    console.log('[loadAccounts]', serversList)
    const accounts = (serversList || []).map(server => parseAccount(server))
    commit('updateAccounts', accounts)
    console.log('getters.getAccountsOf({ profile: true })', getters.getAccountsOf({ profile: true }))
    return getters.getAccountsOf({ profile: true }) // Resolve to all accounts with a profile
  } catch (err) {
    console.warn(err)
    throw err
  }
}

export async function deleteProfile ({ commit, getters }, account) {
  try {
    await deleteServer(account)
    const unserv = { ...account, profile: false }
    commit('updateAccount', unserv)
    return getters.getAccountsOf(unserv)[0] // Resolve to same account but full updated
  } catch (err) {
    console.warn(err)
    throw err
  }
}

export async function initProfile ({ commit, getters }, { account: profile, pass }) {
  try {
    await deleteServer(profile)
    const answer = await initServer(profile, pass)
    if (!answer) throw new Error("Can't init the server")
    const account = parseAccount(answer)
    commit('updateAccount', account)
    return getters.getAccountsOf(account)[0] // Resolve to same account but full updated
  } catch (err) {
    console.warn(err)
    throw err
  }
}

export async function removeAccount ({ commit, getters }, account) {
  try {
    if (account.profile) await deleteServer(account)
    if (account.autorized) await deleteCredentials(account.name)
    commit('delAccount', account)
    return getters.getAccounts // Resolve to remaining accounts
  } catch (err) {
    console.warn(err)
    throw err
  }
}

export async function loadCurrentAccount ({ dispatch, commit, getters }) {
  try {
    const profile = await getServer('-f')
    if (!profile) {
      const account = getters.currentAuthorized[0]
      if (!account) return undefined
      const pass = await getPassword(account.name)
      await dispatch('initProfile', { account, pass })
      return dispatch('setCurrentAccount', account)
    } else {
      const account = parseAccount(profile)
      commit('setCurrentAccount', account)
      return getters.currentAccount
    }
  } catch (err) {
    console.warn(err)
    throw err
  }
}

export async function getCurrentAccount ({ dispatch, getters }) {
  try {
    const account = getters.currentAccount || await dispatch('loadCurrentAccount')
    return account
  } catch (err) {
    console.warn(err)
    throw err
  }
}

export async function setCurrentAccount ({ commit, getters }, profile) {
    try {
      const answer = await changeServer(profile)
      const account = parseAccount(answer)
      commit('setCurrentAccount', account)
      return getters.currentAccount
    } catch (err) {
      console.warn(err)
      throw err
    }
}

export function currentAccount ({ dispatch }, account) {
  if (!account) {
    return dispatch('getCurrentAccount')
  } else {
    return dispatch('setCurrentAccount', account)
  }
}
