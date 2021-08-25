'use strict'
import axios from 'axios'
// import { Store } from 'src/store'
import info from 'src/helpers/info'

const getStore = () => import('src/store')

export async function listDisksOnBackup () {
  try {
    const { computer, bkituser } = await info()
    const { uuid, name, domain } = computer
    const { data: response } = await axios.get(`v1/user/volumes/${uuid}/${name}/${domain}/${bkituser}`)
    return response.map(d => d.volume)
  } catch (err) {
    console.error(err)
  }
  // return []
}

export async function listSnaps (rvid, raw = false) {
  const { Store } = await getStore()
  const getServerURL = Store.getters['global/getServerURL']
  if (!rvid) throw new Error(`The parameter rvid on listSnaps can't be '${rvid}'`)
  const serverURL = getServerURL()
  const { computer, bkituser } = await info()
  const { uuid, name, domain } = computer
  const { data: response } = await axios.get(`${serverURL}/v1/user/snaps/${uuid}/${name}/${domain}/${rvid}/${bkituser}`)
  return raw ? response : response.map(e => e.snap)
}

export async function listPath (rvid, snap, path) {
  const { Store } = await getStore()
  const getServerURL = Store.getters['global/getServerURL']
  if (!snap || !rvid) throw new Error(`The parametera (rvid, snap) on listPath can't be ('${rvid}', '${snap}')`)
  const serverURL = getServerURL()
  const { computer, bkituser: profile } = await info()
  const { uuid, name, domain } = computer
  // format: /list/:uuid/:name/:domain/:profile/:volume/:snap
  const { data: response } = await axios.get(`${serverURL}/v1/user/list/${uuid}/${name}/${domain}/${profile}/${rvid}/${snap}`, {
    params: { path }
  })
  // if axios.get fail the children nodes won't have snap, rvid, uuid, etc. this will avoid future listPath request. This is a good side effect
  const remote = { server: serverURL, uuid, name, domain, profile, rvid, snap, path }
  return response.map(e => {
    return { ...e, remote }
  })
}
