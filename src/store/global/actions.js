/*
export function someAction (context) {
}
*/
import { getAccounts, addAccount as addCredentials, deleteAccount } from 'src/helpers/credentials'
import { listServers, getServer } from 'src/helpers/bkit'

export function addAccount ({ commit }, { user, server, password }) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Add account', user, server)
      await addCredentials(`${user}@${server}`, password)
      commit('addServer', { address: server, user, credentials: true })
      resolve(true)
    } catch (err) {
      reject(err)
    }
  })
}

export function delCredentials ({ commit }, { user, address }) {
  return new Promise(async (resolve, reject) => {
    try {
      await deleteAccount(`${user}@${address}`)
      commit('delServer', { address, user })
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
        return { address, user, credentials: true }
      })
      commit('addServers', servers)
      resolve(servers)
    } catch (err) {
      reject(err)
    }
  })
}

export function loadServers ({ commit }) {
  return new Promise(async (resolve, reject) => {
    try {
      const serversList = await listServers('-f')
      const servers = serversList.map(s => {
        const [user, url] = s.split('@')
        const [address, , section, iport, bport, rport, uport, hport] = url.split(':')
        return { address, user, section, iport, bport, rport, uport, hport, pairing: true }
      })
      commit('addServers', servers)
      resolve(servers)
    } catch (e) {
      reject(e)
    }
  })
}

export function loadCurrentServer ({ commit }) {
  return new Promise(async (resolve, reject) => {
    try {
      const info = await getServer('-f')
      const [user, url] = info.split('@')
      const [address, , section, iport, bport, rport, uport, hport] = url.split(':')
      const server = { address, user, section, iport, bport, rport, uport, hport, pairing: true, current: true }
      commit('addServer', server)
      resolve(server)
    } catch (e) {
      reject(e)
    }
  })
}

export function getCurrentServer ({ commit, getters }) {
  return new Promise(async (resolve, reject) => {
    try {
      const server = getters.currentServer || await loadCurrentServer({ commit })
      resolve(server)
    } catch (e) {
      reject(e)
    }
  })
}
