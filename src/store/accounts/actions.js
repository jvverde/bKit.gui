/*
export function someAction (context) {
}
*/
import { getAccounts as getCredentials, addAccount as addCredentials, deleteAccount as deleteCredentials } from 'src/helpers/credentials'

export function addAccount ({ commit, getters }, { user, serverURL, password }) {
  return new Promise(async (resolve, reject) => {
    try {
      const name = `${user}@${serverURL}`
      console.log('Add account', name)
      commit('addAccount', { serverURL, user, name, autorized: true })
      await addCredentials(name, password)
      resolve(true)
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
      resolve(unAuthAccount)
    } catch (err) {
      reject(err)
    }
  })
}

// const re = new RegExp('^(https?://)?(?<servername>[^:]+)(:(?<port>[0-9]+)?)')
export function loadCredentials ({ commit }) {
  return new Promise(async (resolve, reject) => {
    try {
      const credentials = await getCredentials()
      const accounts = credentials.map(name => {
        console.log('Found credentials for:', name)
        const [user, serverURL] = name.split('@')
        return { name, serverURL, user, autorized: true }
      })
      commit('updateAccounts', accounts)
      resolve(accounts)
    } catch (err) {
      reject(err)
    }
  })
}

/* Operations related with accounts defined on filesystem on ETCDIR */
import { listServers, getServer, changeServer, deleteServer, initServer } from 'src/helpers/bkit'

const parseAccount = (name, profile = true) => {
  if (!name) return {}
  const [user, url] = name.split('@')
  const [servername, , section, iport, bport, rport, uport, hport] = url.split(':')
  return { name, servername, user, section, iport, bport, rport, uport, hport, profile }
}

export function loadAccounts ({ commit }) {
  return new Promise(async (resolve, reject) => {
    try {
      const serversList = await listServers('-f')
      const accounts = serversList.map(server => parseAccount(server))
      commit('updateAccounts', accounts)
      resolve(accounts)
    } catch (e) {
      reject(e)
    }
  })
}

export function deleteProfile ({ commit }, account) {
  return new Promise(async (resolve, reject) => {
    try {
      await deleteServer(account)
      const unserv = { ...account, profile: false }
      commit('updateAccount', unserv)
      resolve(unserv)
    } catch (e) {
      reject(e)
    }
  })
}

export function initProfile ({ commit }, { account: profile, pass }) {
  return new Promise(async (resolve, reject) => {
    try {
      await deleteServer(profile)
      const answer = await initServer(profile, pass)
      const account = parseAccount(answer)
      commit('updateAccount', account)
      resolve(account)
    } catch (e) {
      reject(e)
    }
  })
}

export function removeAccount ({ commit }, account) {
  return new Promise(async (resolve, reject) => {
    try {
      if (account.profile) await deleteServer(account)
      if (account.autorized) await deleteCredentials(account.name)
      commit('delAccount', account)
      resolve(true)
    } catch (e) {
      reject(e)
    }
  })
}

export function loadCurrentAccount ({ commit }) {
  return new Promise(async (resolve, reject) => {
    try {
      const profile = await getServer('-f')
      if (!profile) return resolve(undefined)
      const account = parseAccount(profile)
      commit('setCurrentAccount', account)
      resolve(account)
    } catch (e) {
      reject(e)
    }
  })
}

export function getCurrentAccount ({ commit, getters }) {
  return new Promise(async (resolve, reject) => {
    try {
      const account = getters.currentAccount || await loadCurrentAccount({ commit })
      resolve(account)
    } catch (e) {
      reject(e)
    }
  })
}

export function setCurrentAccount ({ commit }, profile) {
  return new Promise(async (resolve, reject) => {
    try {
      const answer = await changeServer(profile)
      const account = parseAccount(answer)
      commit('setCurrentAccount', account)
      resolve(account)
    } catch (e) {
      reject(e)
    }
  })
}

export function currentAccount ({ commit, getters }, account) {
  if (!account) {
    return getCurrentAccount({ commit, getters })
  } else {
    return setCurrentAccount({ commit }, account)
  }
}
