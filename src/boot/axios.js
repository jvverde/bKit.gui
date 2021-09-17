import Vue from 'vue'
import axios from 'axios'
import { getPassword } from 'src/helpers/credentials'

Vue.prototype.$axios = axios

const needAuthorization = new RegExp('(/v[0-9]+)?/user/')
// http://10.1.1.4:8765/v1/user/list/E4E8DBC1-8869-4B41-AC4C-C673BD5E7B90/WIN11/WORKGROUP/Administrator/C.421BA879._.3.NTFS/@GMT-2021.08.23-14.12.43
const rf = new RegExp('(/v[0-9]+)?/user/list/(.+/){5}@.+') // RE for URL of a list path within a snapshot

const checkStatus = (val, { response: { status } = {} } = {}) => status === val

const getconfig = ({ response: { config } = {} } = {}) => config

const pathlike = ({ url = '', params: { path = '' } = {} } = {}) => `${url}/${path}`

const noBackupPaths = new Set()
let noBackupParents = []
const hasMissingParent = path => noBackupParents.some(e => path.startsWith(e))

const promises = []

const setAuthorization = (config, token) => {
  if (token) config.headers['Authorization'] = `Bearer ${token}`
}

export default ({ router, store }) => {
  const getCurrentAccount = () => store.getters['accounts/account']
  const getCurrentUser = () => store.getters['accounts/account'].user
  const getCurrentServerURL = () => store.getters['accounts/account'].serverURL

  const askpass = (user = getCurrentUser()) => {
    const server = getCurrentServerURL()
    return router.push({ name: 'login', params: { server, user } })
  }

  const autologin = async (username) => {
    console.info('Try autologin for user', username)
    try {
      const serverURL = getCurrentServerURL()
      const hashpass = await getPassword(`${username}@${serverURL}`)
      if (!hashpass) throw new Error("Can't find a user password")
      const token = await store.dispatch('auth/login', { username, serverURL, hashpass })
      return token
    } catch (err) {
      console.warn('Auto login error:', err)
      askpass(username)
      return new Promise(resolve => promises.push(token => {
        console.log('Resolve to', token)
        resolve(token)
      }))
    }
  }

  axios.interceptors.request.use(async (config) => {
    // Avoid send to server requests of type /v1/user/list/somepath if parent hasn't in server
    if (rf.test(config.url)) {
      const path = pathlike(config)
      if (hasMissingParent(path)) {
        return Promise.reject(`A parent of ${path} is not on backup`)
      }
    }
    return config
  }, error => Promise.reject(error))

  axios.interceptors.request.use(async (config) => {
    config.baseURL = config.baseURL || getCurrentServerURL()
    const authorization = config.headers['Authorization']
    if (!authorization && config.url.match(needAuthorization)) {
      console.log('Try to set token for', config.url)
      const current = store.getters['accounts/currentAccount']
      const session = `${current.user}@${config.baseURL}`
      const token = store.getters['auth/accessToken'](session) || (await autologin(current.user))
      setAuthorization(config, token)
    }
    return config
  }, error => Promise.reject(error))

  axios.interceptors.response.use(response => {
    if (response.data.token) {
      console.log('Login token received', response.data.token)
      promises.forEach(promise => promise(response.data.token))
      promises.splice(0, promises.length) // reset promises
    }
    return response
  }, error => {
    if (checkStatus(401, error)) {
      console.log('You need to login first')
      const originalRequest = error.config
      askpass()
      return new Promise(resolve => promises.push((token) => {
        setAuthorization(originalRequest, token)
        console.log('Resend original url', originalRequest.url)
        resolve(axios(originalRequest))
      }))
    } else if (checkStatus(404, error)) {
      const config = getconfig(error)
      const path = pathlike(config)
      if (rf.test(path)) {
        console.log(`404 for ${path}. Put it on list of no parents backup`)
        noBackupPaths.add(path)
        noBackupParents = [...noBackupPaths].sort()
        return Promise.reject(`${path} is not on backup`)
      }
    } else return Promise.reject(error)
  })
}
