import Vue from 'vue'
import VueRouter from 'vue-router'

import routes from './routes'

// import { Store } from 'src/store'

// const currentServer = () => Store.getters['global/server']
// import { getServer } from 'src/helpers/bkit'

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

  //   router.beforeEach(async (to, from, next) => {
  //     let server
  //     try {
  //       console.log('Get current server')
  //       server = currentServer() || await getServer()
  //     } catch (err) {
  //       console.warn("Can't find a server")
  //     }
  //     console.log('Go to', to.name)
  //     if (to.name === from.name) {
  //       next(false)
  //     } else if (to.name === 'customize') {
  //       next()
  //     } else if (to.name !== 'servers' && !server) {
  //       next({ name: 'servers', params: { back: to.name } })
  //     } else {
  //       next()
  //     }
  //   })
  router.beforeEach((to, from, next) => {
    console.log('from:', from.path)
    console.log('to:', to.path)
    next()
  })

  return router
}
