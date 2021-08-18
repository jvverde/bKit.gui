import axios from 'axios'
import { hmac } from 'src/helpers/secrets'
import { LoginError } from 'src/helpers/errors'

export function login ({ commit }, { username, serverURL, hashpass }) {
  return new Promise(async (resolve, reject) => {
    try {
      const { data: info } = await axios.get(`${serverURL}/v1/info`)
      const date = info.date
      const proof = hmac(date, hashpass)
      const { data: answer } = await axios.post(`${serverURL}/v1/auth/login`, { proof, username, date })
      if (answer.token && answer.proof === hmac(answer.token, hashpass)) {
        commit('setToken', { account: `${username}@${serverURL}`, token: answer.token })
      } else throw new LoginError('Invalid token received')
      resolve(answer.token)
    } catch (err) {
      if (err.message.match(/status code 422/)) {
        reject(new LoginError('Invalid password'))
      } else {
        reject(new LoginError(err))
      }
    }
  })
}
