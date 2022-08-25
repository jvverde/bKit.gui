export function addServer ({ commit, getters }, server) {
  return new Promise((resolve, reject) => {
    try {
      console.log('Add server', server)
      commit('addServer', server)
      if (!getters.currentServer) {
        commit('setCurrentServer', server)
      }
      resolve(getters.getServerOf(server))
    } catch (e) {
      reject(e)
    }
  })
}
