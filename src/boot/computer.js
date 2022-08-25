// This data is not supposed to change in the program lifetime
'use strict'
import { getUser, getComputerInfo } from 'src/helpers/bkit'

console.log('Get user and computer info')

// const username = require('os').userInfo().username

let pResolve, pReject

export const pInfo = new Promise((resolve, reject) => {
  pResolve = resolve
  pReject = reject
})

export default async () => {
  try {
    const os = await window.electron.os()
    const username = os.userInfo.username
    const localUser = getUser
    const computer = await getComputerInfo()
    const [domain, name, uuid] = computer.split('|')
    const info = {
      localUser,
      username,
      computer: { domain, name, uuid }
    }
    pResolve(info)
    return info
  } catch (err) {
    pReject(err)
  }
}
