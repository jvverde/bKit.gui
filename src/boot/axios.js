import Vue from 'vue'
import axios from 'axios'

Vue.prototype.$axios = axios

export default ({ router }) => {
  axios.interceptors.response.use(response => {
    return response
  }, error => {
    if (error.response.status === 401) {
      console.log('You need to login first login')
      router.push({ name: 'login' })
    }
  })
}
