/*
export function someAction (context) {
}
*/
import { getAccounts, addAccount as addCredentials, deleteAccount } from 'src/helpers/credentials'

export function addAccount ({ commit }, { user, server, password }) {
  return new Promise(async (resolve, reject) => {
    try {
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
      console.log('loadCredentials', servers)
      commit('addServers', servers)
      resolve(servers)
    } catch (err) {
      reject(err)
    }
  })
}
