import Vue from 'vue'
import axios from 'axios'

Vue.prototype.$axios = axios

const re = new RegExp('(/v[0-9]+)?/user/', 'i')

export default ({ router, store }) => {
  axios.interceptors.request.use(config => {
    const url = new URL(config.url)
    if (url.pathname.match(re)) {
      const current = store.getters['global/currentAccount']
      const session = `${current.user}@${url.origin}`
      console.log('session', session)
      const token = store.getters['auth/accessToken'](session)
      console.log('token', token)
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
