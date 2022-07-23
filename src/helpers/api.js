'use strict'
import axios from 'axios'
import { pInfo } from 'src/boot/computer'
import { Store } from 'src/store'

const getCurrentClient = () => Store.getters['clients/getCurrentClient']

export async function listDisksOnBackup () {
  try {
    const { computer, localUser } = await pInfo
    // Use getCurrentClient but fallback to (local)computer
    const { uuid, name, domain } = { ...computer, ...getCurrentClient() }
    const { data } = await axios.get(`v1/user/volumes/${localUser}/${uuid}/${name}/${domain}`)
    return data // .map(d => d.volume)
  } catch (err) {
    console.error(err)
  }
  // return []
}

export async function listAllDisksOnBackup () {
  try {
    // const { localUser } = await pInfo
    // Use getCurrentClient but fallback to (local)computer
    const { data } = await axios.get('v1/user/volumes')
    // console.warn('DATA SIZE', data.length)
    return data // .map(d => d.volume)
  } catch (err) {
    console.error(err)
  }
  // return []
}

export async function listSnaps (rvid, raw = false) {
  if (!rvid) throw new Error(`The parameter rvid of listSnaps can't be '${rvid}'`)
  const { computer, localUser } = await pInfo
  const { uuid, name, domain, user } = { ...computer, user: localUser, ...getCurrentClient() }
  const { data: response } = await axios.get(`/v1/user/snaps/${uuid}/${name}/${domain}/${rvid}/${user}`)
  return raw ? response : response.map(e => e.snap)
}

export async function listPath (rvid, snap, path) {
  if (!snap || !rvid) throw new Error(`The parametera (rvid, snap) on listPath can't be ('${rvid}', '${snap}')`)
  const { computer, localUser } = await pInfo
  const { uuid, name, domain, user } = { ...computer, user: localUser, ...getCurrentClient() }
  // format: /list/:uuid/:name/:domain/:profile/:volume/:snap
  const { data: response } = await axios.get(`/v1/user/list/${uuid}/${name}/${domain}/${user}/${rvid}/${snap}`, {
    params: { path }
  })
  /*
    if axios.get fail for a given path, its children nodes won't have snap, rvid, uuid, etc.
    This will avoid future listPath request. This is a good side effect
  */
  const remote = { uuid, name, domain, user, rvid, snap, path }
  return response.map(e => {
    return { ...e, remote }
  })
}
