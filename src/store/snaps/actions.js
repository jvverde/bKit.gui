import { listSnaps } from 'src/helpers/api'

export async function loadSnaps ({ commit }, rvid) {
    try {
      const snaps = (await listSnaps(rvid, true)).map(e => ({
        ...e,
        id: e.snap
      }))
      commit('setSnaps', snaps)
      return snaps
    } catch (err) {
      console.warn(err)
      throw err
    }
}
