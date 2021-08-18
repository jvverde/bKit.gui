import Vue from 'vue'
import axios from 'axios'
import { getPassword } from 'src/helpers/credentials'

Vue.prototype.$axios = axios

const re = new RegExp('(/v[0-9]+)?/user/')

export default ({ router, store }) => {
  const autologin = async (username) => {
    console.info('Try autologin for user', username)
    try {
      const serverName = store.getters['global/serverName']
      const getServerURL = store.getters['global/getServerURL']
      const serverURL = getServerURL(serverName)
      const hashpass = await getPassword(`${username}@${serverName}`)

      const token = await store.dispatch('auth/login', { username, serverURL, hashpass })
      return token
    } catch (err) {
      console.warn(err)
    }
  }

  axios.interceptors.request.use(async (config) => {
    const url = new URL(config.url)
    if (url.pathname.match(re)) {
      const current = store.getters['global/currentAccount']
      const session = `${current.user}@${url.origin}`
      const token = store.getters['auth/accessToken'](session) || (await autologin(current.user))
      if (token) {
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
