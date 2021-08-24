'use strict'
import { getUser, getComputerInfo } from 'src/helpers/bkit'

console.log('Get user and computer info')

const username = require('os').userInfo().username

export default async () => {
  const pUser = getUser()
  const pInfo = getComputerInfo()
  const bkituser = await pUser
  const info = await pInfo
  const [domain, name, uuid] = info.split('|')
  return {
    bkituser,
    username,
    computer: { domain, name, uuid }
  }
}
