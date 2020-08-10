/*
export function someAction (context) {
}
*/
import { getAccounts, addAccount as addCredentials } from 'src/helpers/credentials'

export function addAccount ({ commit }, { user, address, password }) {
  return new Promise(async (resolve, reject) => {
    try {
      await addCredentials(`${user}@${address}`, password)
      commit('addServer', { address, user, credentials: true })
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
