import Vue from 'vue'
import axios from 'axios'
import { getPassword } from 'src/helpers/credentials'

Vue.prototype.$axios = axios

const re = new RegExp('(/v[0-9]+)?/user/')

export default ({ router, store }) => {
  axios.interceptors.request.use(async (config) => {
    const url = new URL(config.url)
    console.log('url.pathname:', url.pathname, re)
    if (url.pathname.match(re)) {
      const current = store.getters['global/currentAccount']
      const session = `${current.user}@${url.origin}`
      console.log('session', session)
      const token = store.getters['auth/accessToken'](session)
      console.log('token', token)
      if (token) {
        config.headers['Authorization'] = 'Bearer ' + token
      } else {
        // const login = store.actions['auth/login']
        const getServerURL = store.getters['global/getServerURL']
        const serverName = store.getters['global/serverName']
        const username = current.user
        const serverURL = getServerURL(serverName)
        const hashpass = await getPassword(`${username}@${serverName}`)
        console.log({ username, serverURL, hashpass, serverName })

        // const token = login({ username, serverURL, hashpass })
        const token = await store.dispatch('auth/login', { username, serverURL, hashpass })
        config.headers['Authorization'] = 'Bearer ' + token
      }
    }
    return config
  }, error => Promise.reject(error))

  axios.interceptors.response.use(response => {
    return response
  }, error => {
    if (error && error.response && error.response.status === 401) {
      console.log('You need to login first')
      router.push({ name: 'login' })
    } else {
      console.error('Error', error)
      return Promise.reject(error)
    }
  })
}
