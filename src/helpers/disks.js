export const compareByUUID = (a, b) => {
  if (a.computer.uuid < b.computer.uuid) return -1
  if (a.computer.uuid > b.computer.uuid) return 1
  return 0
}
export const compareByLabel = (a, b) => {
  if (a.label < b.label) return -1
  if (a.label > b.label) return 1
  return compareByUUID(a, b)
}
export const compareByLetter = (a, b) => {
  if (a.letter < b.letter) return -1
  if (a.letter > b.letter) return 1
  return compareByLabel(a, b)
}
export const compareByUser = (a, b) => {
  if (a.computer.user < b.computer.user) return -1
  if (a.computer.user > b.computer.user) return 1
  return compareByLetter(a, b)
}
export const compareByName = (a, b) => {
  if (a.computer.name < b.computer.name) return -1
  if (a.computer.name > b.computer.name) return 1
  return compareByUser(a, b)
}
export const compareByDomain = (a, b) => {
  if (a.computer.domain < b.computer.domain) return -1
  if (a.computer.domain > b.computer.domain) return 1
  return compareByName(a, b)
}
export const compareByRVID = (a, b) => {
  if (a.rvid < b.rvid) return -1
  if (a.rvid > b.rvid) return 1
  return compareByDomain(a, b)
}
export const compareDisks = (a, b) => {
  if (!a.mountpoint && !b.mountpoint) return compareByRVID(a, b)
  if (a.mountpoint && !b.mountpoint) return -1
  if (b.mountpoint && !a.mountpoint) return 1
  if (a.mountpoint < b.mountpoint) return -1
  if (a.mountpoint > b.mountpoint) return 1
  return 0
}

// export const makeKey = (...val) => val.join('')

export const getId = d => [d.mountpoint, d.uuid, d.rvid, d.computer.uuid, d.computer.name, d.computer.domain, d.computer.user].join('>')
export const isSameDisk = (a, b) => a && b && a.id === b.id

export class Disk {
  constructor (obj) {
    Object.assign(this, obj)
    this.id = getId(this)
  }
  isOnComputer (a) {
    const b = this.computer || {}
    return a.uuid === b.uuid && a.user === b.user && a.name === b.name && a.domain === b.domain
  }
  get diskname () {
    return this.name.replace(/\\$/, '').replace(/^_$/, this.label) // remove ending backslash
  }
  get hasLetter () {
    return this.name !== '_'
  }
}
