/*
export function someAction (context) {
}
*/
import { getAccounts as getCredentials, addAccount as addCredentials, deleteAccount as deleteCredentials, getPassword } from 'src/helpers/credentials'

export function addAccount ({ commit, getters }, { user, serverURL, password }) {
  return new Promise(async (resolve, reject) => {
    try {
      const name = `${user}@${serverURL}`
      const account = { serverURL, user, name, autorized: true }
      console.info('Add account', account)
      commit('addAccount', account)
      await addCredentials(name, password)
      resolve(getters.getAccountsOf(account)[0]) // Resolve to same account but full updated
    } catch (err) {
      reject(err)
    }
  })
}

export function removeCredentials ({ commit, getters }, account) {
  return new Promise(async (resolve, reject) => {
    try {
      await deleteCredentials(account.name)
      const unAuthAccount = { ...account, autorized: false }
      commit('updateAccount', unAuthAccount)
      resolve(getters.getAccountsOf({ autorized: false })) // Resolve to all not authorized accounts
    } catch (err) {
      reject(err)
    }
  })
}

// const re = new RegExp('^(https?://)?(?<servername>[^:]+)(:(?<port>[0-9]+)?)')
export function loadCredentials ({ commit, getters }) {
  return new Promise(async (resolve, reject) => {
    try {
      const credentials = await getCredentials()
      const accounts = credentials.map(name => {
        console.info('Found credentials for:', name)
        const [user, serverURL] = name.split('@')
        return { name, serverURL, user, autorized: true }
      })
      commit('updateAccounts', accounts)
      resolve(getters.getAccountsOf({ autorized: true })) // Resolve to all authorized accounts
    } catch (err) {
      reject(err)
    }
  })
}

/* Operations related with accounts defined on filesystem on ETCDIR */
import { listServers, getServer, changeServer, deleteServer, initServer } from 'src/helpers/bkit'

const parseAccount = (line, profile = true) => {
  if (!line) return {}
  const [user, url] = line.split('@')
  const [servername, , section, iport, bport, rport, uport, hport] = url.split(':')
  const serverURL = `http://${servername}:${hport}`
  const name = `${user}@${serverURL}`
  return { name, serverURL, servername, user, section, iport, bport, rport, uport, hport, profile }
}

export function loadAccounts ({ commit, getters }) {
  return new Promise(async (resolve, reject) => {
    try {
      const serversList = await listServers('-f')
      console.info('serversList', serversList)
      const accounts = serversList.map(server => parseAccount(server))
      commit('updateAccounts', accounts)
      resolve(getters.getAccountsOf({ profile: true })) // Resolve to all accounts with a profile
    } catch (e) {
      reject(e)
    }
  })
}

export function deleteProfile ({ commit, getters }, account) {
  return new Promise(async (resolve, reject) => {
    try {
      await deleteServer(account)
      const unserv = { ...account, profile: false }
      commit('updateAccount', unserv)
      resolve(getters.getAccountsOf(unserv)[0]) // Resolve to same account but full updated
    } catch (e) {
      reject(e)
    }
  })
}

export function initProfile ({ commit, getters }, { account: profile, pass }) {
  return new Promise(async (resolve, reject) => {
    try {
      await deleteServer(profile)
      const answer = await initServer(profile, pass)
      if (!answer) throw new Error("Can't init the server")
      const account = parseAccount(answer)
      commit('updateAccount', account)
      resolve(getters.getAccountsOf(account)[0]) // Resolve to same account but full updated
    } catch (e) {
      reject(e)
    }
  })
}

export function removeAccount ({ commit, getters }, account) {
  return new Promise(async (resolve, reject) => {
    try {
      if (account.profile) await deleteServer(account)
      if (account.autorized) await deleteCredentials(account.name)
      commit('delAccount', account)
      resolve(getters.getAccounts) // Resolve to remaining accounts
    } catch (e) {
      reject(e)
    }
  })
}

export function loadCurrentAccount ({ dispatch, commit, getters }) {
  return new Promise(async (resolve, reject) => {
    try {
      const profile = await getServer('-f')
      if (!profile) {
        const account = getters.currentAuthorized[0]
        if (!account) return resolve(undefined)
        const pass = await getPassword(account.name)
        await dispatch('initProfile', { account, pass })
        return dispatch('setCurrentAccount', account)
      } else {
        const account = parseAccount(profile)
        commit('setCurrentAccount', account)
        resolve(getters.currentAccount)
      }
    } catch (e) {
      reject(e)
    }
  })
}

export function getCurrentAccount ({ dispatch, commit, getters }) {
  return new Promise(async (resolve, reject) => {
    try {
      const account = getters.currentAccount || await dispatch('loadCurrentAccount')
      resolve(account)
    } catch (e) {
      reject(e)
    }
  })
}

export function setCurrentAccount ({ commit, getters }, profile) {
  return new Promise(async (resolve, reject) => {
    try {
      const answer = await changeServer(profile)
      const account = parseAccount(answer)
      commit('setCurrentAccount', account)
      resolve(getters.currentAccount)
    } catch (e) {
      reject(e)
    }
  })
}

export function currentAccount ({ dispatch }, account) {
  if (!account) {
    return dispatch('getCurrentAccount')
  } else {
    return dispatch('setCurrentAccount', account)
  }
}
