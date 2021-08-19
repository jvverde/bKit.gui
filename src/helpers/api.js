'use strict'
import axios from 'axios'
import { Store } from 'src/store'
import info from './info'

const getServerURL = Store.getters['global/getServerURL']

export async function listDisksOnBackup () {
  try {
    const serverURL = getServerURL()
    const { computer, bkituser } = await info()
    const { uuid, name, domain } = computer
    const { data: response } = await axios.get(`${serverURL}/v1/user/volumes/${uuid}/${name}/${domain}/${bkituser}`)
    return response.map(d => d.volume)
  } catch (err) {
    console.error(err)
  }
  // return []
}

export async function listSnaps (rvid) {
  const serverURL = getServerURL()
  const { computer, bkituser } = await info()
  const { uuid, name, domain } = computer
  const { data: response } = await axios.get(`${serverURL}/v1/user/snaps/${uuid}/${name}/${domain}/${rvid}/${bkituser}`)
  return response.map(e => e.snap)
}
