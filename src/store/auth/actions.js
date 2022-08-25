import axios from 'axios'
import { LoginError } from 'src/helpers/errors'

const { hmac } =  window.electron.secrets

export async function login ({ commit }, { username, serverURL, hashpass }) {
  try {
    const { data: info } = await axios.get(`${serverURL}/v1/info`)
    const date = info.date
    const proof = hmac(date, hashpass)
    const response = await axios.post(`${serverURL}/v1/auth/login`, { proof, username, date })
    if (!response) throw new LoginError('Login error')
    const { data: answer } = response
    if (answer.token && answer.proof === hmac(answer.token, hashpass)) {
      commit('setToken', { account: `${username}@${serverURL}`, token: answer.token })
    } else throw new LoginError('Invalid token received')
    return answer.token
  } catch (err) {
    if (err.message.match(/status code 422/)) {
      throw new LoginError('Wrong password')
    } else {
      throw new LoginError(err)
    }
  }
}
