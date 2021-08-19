'use strict'
import { getUser, getComputerInfo } from 'src/helpers/bkit'

console.log('Get user and computer info')

const username = require('os').userInfo().username

const pUser = getUser()
const pInfo = getComputerInfo()

export default async function () {
  const bkituser = await pUser
  const info = await pInfo
  const [domain, name, uuid] = info.split('|')
  return {
    bkituser,
    username,
    computer: { domain, name, uuid }
  }
}
