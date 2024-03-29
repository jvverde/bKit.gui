import Vue from 'vue'
import Vuex from 'vuex'

// import example from './module-example'

Vue.use(Vuex)

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */
import accounts from './accounts'
import servers from './servers'
import clients from './clients'
import auth from './auth'
import view from './view'
import snaps from './snaps'
import backups from './backups'
import restore from './restore'
import disks from './disks'
import options from './options'

// From https://forum.quasar-framework.org/topic/4276/how-to-use-vuex-store-without-access-to-vue-instance/2
// Don't if this is a SSR
export const Store = new Vuex.Store({
  modules: {
    accounts,
    servers,
    clients,
    disks,
    auth,
    view,
    snaps,
    backups,
    restore,
    options
  },

  // enable strict mode (adds overhead!)
  // for dev mode only
  strict: process.env.DEV
})

export default function (/* { ssrContext } */) {
  // const Store = new Vuex.Store({
  //   modules: {
  //   },

  //   // enable strict mode (adds overhead!)
  //   // for dev mode only
  //   strict: process.env.DEV
  // })

  return Store
}
