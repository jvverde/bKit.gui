'use strict'
import { getUser, getComputerInfo } from 'src/helpers/bkit'

const username = require('os').userInfo().username

const bkituser = getUser()
const pInfo = getComputerInfo()

export default async function () {
  const info = await pInfo
  const [domain, name, uuid] = info.split('|')
  return {
    bkituser: await bkituser,
    username,
    computer: { domain, name, uuid }
  }
}
