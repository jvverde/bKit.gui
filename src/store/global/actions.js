/*
export function someAction (context) {
}
*/
import { getAccounts, addAccount as addCredentials, deleteAccount } from 'src/helpers/credentials'
import { listServers, getServer, changeServer, deleteServer, initServer } from 'src/helpers/bkit'

export function addAccount ({ commit }, { user, server, password }) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Add account', user, server)
      await addCredentials(`${user}@${server}`, password)
      commit('addAccount', { address: server, user, autorized: true })
      resolve(true)
    } catch (err) {
      reject(err)
    }
  })
}

export function delCredentials ({ commit, getters }, { user, address }) {
  return new Promise(async (resolve, reject) => {
    try {
      await deleteAccount(`${user}@${address}`)
      // Get is a copy with credentials property set to false
      const server = { ...getters.getAccount(address, user), autorized: false }
      commit('addAccount', server)
      resolve(true)
    } catch (err) {
      reject(err)
    }
  })
}

export function loadCredentials ({ commit }) {
  return new Promise(async (resolve, reject) => {
    try {
      const accounts = await getAccounts()
      const servers = accounts.map(u => {
        const [user, address] = u.split('@')
        return { address, user, autorized: true }
      })
      commit('addAccounts', servers)
      resolve(servers)
    } catch (err) {
      reject(err)
    }
  })
}

const line2Account = (line, profile = true) => {
  if (!line) return {}
  const [user, url] = line.split('@')
  const [address, , section, iport, bport, rport, uport, hport] = url.split(':')
  return { address, user, section, iport, bport, rport, uport, hport, profile }
}

export function loadAccounts ({ commit }) {
  return new Promise(async (resolve, reject) => {
    try {
      const serversList = await listServers('-f')
      const servers = serversList.map(line => {
        return line2Account(line)
      })
      commit('addAccounts', servers)
      resolve(servers)
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
      commit('addAccount', unserv)
      resolve(unserv)
    } catch (e) {
      reject(e)
    }
  })
}

export function removeAccount ({ commit }, account) {
  return new Promise(async (resolve, reject) => {
    try {
      if (account.profile) await deleteServer(account)
      if (account.autorized) await deleteAccount(`${account.user}@${account.address}`)
      commit('delAccount', account)
      resolve(true)
    } catch (e) {
      reject(e)
    }
  })
}

export function initProfile ({ commit }, { account, pass }) {
  return new Promise(async (resolve, reject) => {
    try {
      await deleteServer(account)
      const answer = await initServer(account, pass)
      const server = line2Account(answer)
      commit('addAccount', server)
      resolve(server)
    } catch (e) {
      reject(e)
    }
  })
}

export function loadCurrentAccount ({ commit }) {
  return new Promise(async (resolve, reject) => {
    try {
      const line = await getServer('-f')
      const server = line2Account(line)
      commit('setCurrentServer', server)
      resolve(server)
    } catch (e) {
      reject(e)
    }
  })
}

export function getCurrentServer ({ commit, getters }) {
  return new Promise(async (resolve, reject) => {
    try {
      const server = getters.currentAccount || await loadCurrentAccount({ commit })
      resolve(server)
    } catch (e) {
      reject(e)
    }
  })
}

export function setCurrentServer ({ commit }, account) {
  return new Promise(async (resolve, reject) => {
    try {
      const line = await changeServer(account)
      const server = line2Account(line)
      commit('setCurrentServer', server)
      resolve(server)
    } catch (e) {
      reject(e)
    }
  })
}

export function currentAccount ({ commit, getters }, account) {
  if (!account) {
    return getCurrentServer({ commit, getters })
  } else {
    return getCurrentServer({ commit }, account)
  }
}
