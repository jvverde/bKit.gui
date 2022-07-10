import { listSnaps } from 'src/helpers/api'

export function loadSnaps ({ commit }, rvid) {
  return new Promise(async (resolve, reject) => {
    try {
      const snaps = (await listSnaps(rvid, true)).map(e => ({
        ...e,
        id: e.snap
      }))
      console.log('snaps:', snaps)
      commit('setSnaps', snaps)
      resolve(snaps)
    } catch (err) {
      reject(err)
    }
  })
}
