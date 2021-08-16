'use strict'
import axios from 'axios'
import { Store } from 'src/store'
import { getComputerInfo } from './bkit'

const getServerURL = Store.getters['global/getServerURL']
const pInfo = getComputerInfo() // Promise a info

export async function listDisksOnBackup () {
  try {
    const serverURL = getServerURL()
    const info = await pInfo
    const [, , uuid] = info.split('|')
    const { data: response } = await axios.get(`${serverURL}/v1/user/volumes/${uuid}`)
    return response.map(d => d.volume)
  } catch (err) {
    console.error(err)
  }
  // return []
}
