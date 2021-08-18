/*
export function someAction (context) {
}
*/
import { getAccounts as getCredentials, addAccount as addCredentials, deleteAccount as removeCredentials } from 'src/helpers/credentials'

export function addAccount ({ commit }, { user, server, password }) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Add account', user, server)
      await addCredentials(`${user}@${server}`, password)
      commit('addAccount', { servername: server, user, autorized: true })
      resolve(true)
    } catch (err) {
      reject(err)
    }
  })
}

export function delCredentials ({ commit, getters }, { user, servername }) {
  return new Promise(async (resolve, reject) => {
    try {
      await removeCredentials(`${user}@${servername}`)
      // Get a copy of this account and set autorized property to false
      const account = { ...getters.getAccount(servername, user), autorized: false }
      commit('updateAccount', account)
      resolve(true)
    } catch (err) {
      reject(err)
    }
  })
}

export function loadCredentials ({ commit }) {
  return new Promise(async (resolve, reject) => {
    try {
      const credentials = await getCredentials()
      const accounts = credentials.map(u => {
        const [user, servername] = u.split('@')
        return { servername, user, autorized: true }
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

const parseAccount = (line, profile = true) => {
  if (!line) return {}
  const [user, url] = line.split('@')
  const [servername, , section, iport, bport, rport, uport, hport] = url.split(':')
  return { servername, user, section, iport, bport, rport, uport, hport, profile }
}

export function loadAccounts ({ commit }) {
  return new Promise(async (resolve, reject) => {
    try {
      const serversList = await listServers('-f')
      const accounts = serversList.map(server => {
        return parseAccount(server)
      })
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
      if (account.autorized) await removeCredentials(`${account.user}@${account.servername}`)
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
