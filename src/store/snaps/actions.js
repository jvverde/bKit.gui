import { listSnaps } from 'src/helpers/api'

export function loadSnaps ({ commit }, rvid) {
  return new Promise(async (resolve, reject) => {
    try {
      const snaps = await listSnaps(rvid, true)
      commit('setSnaps', snaps)
      resolve(snaps)
    } catch (err) {
      reject(err)
    }
  })
}
