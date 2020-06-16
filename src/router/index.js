import Vue from 'vue'
import VueRouter from 'vue-router'

import routes from './routes'

import { Store } from 'src/store'

const server = () => Store.getters['global/server']

// const isBkitInstalled = () => Store.getters['global/bkitinstalled']
// const isBkitOk = () => Store.getters['global/bkitok']

Vue.use(VueRouter)

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
    } else if (to.name !== 'servers' && !server()) {
      next({ name: 'servers' })
    } else {
      next()
    }
  })

  return router
}
