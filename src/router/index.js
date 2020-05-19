import Vue from 'vue'
import VueRouter from 'vue-router'

import routes from './routes'

import { Store } from 'src/store'

// const isBkitInstalled = () => Store.getters['global/bkitinstalled']
const isBkitOk = () => Store.getters['global/bkitok']

Vue.use(VueRouter)

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default function (/* { store, ssrContext } */) {
  const router = new VueRouter({
    scrollBehavior: () => ({ x: 0, y: 0 }),
    routes,

    // Leave these as they are and change in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    mode: process.env.VUE_ROUTER_MODE,
    base: process.env.VUE_ROUTER_BASE
  })

  router.beforeEach((to, from, next) => {
    if (to.name === from.name) {
      next(false)
    } else if (to.name.match(/^update$|^home$/)) {
      next()
    } else if (!isBkitOk()) {
      next({ name: 'update' })
    } else {
      next()
    }
  })

  return router
}
