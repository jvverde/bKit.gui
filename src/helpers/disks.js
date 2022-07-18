export const compareByUser = (a, b) => {
  if (a.user < b.user) return -1
  if (a.user > b.user) return 1
  return 0
}
export const compareByUUID = (a, b) => {
  if (a.uuid < b.uuid) return -1
  if (a.uuid > b.uuid) return 1
  return compareByUser(a, b)
}
export const compareByName = (a, b) => {
  if (a.name < b.name) return -1
  if (a.name > b.name) return 1
  return compareByUUID(a, b)
}
export const compareByDomain = (a, b) => {
  if (a.domain < b.doman) return -1
  if (a.domain > b.domain) return 1
  return compareByName(a, b)
}
export const compareByRVID = (a, b) => {
  if (a.rvid < b.rvid) return -1
  if (a.rvid > b.rvid) return 1
  return compareByDomain(a, b)
}
export const compareDisks = (a, b) => {
  if (a.mountpoint && !b.mountpoint) return -1
  if (b.mountpoint && !a.mountpoint) return 1
  if (!a.mountpoint && !b.mountpoint) return compareByRVID(a, b)
  if (a.mountpoint < b.mountpoint) return -1
  if (a.mountpoint > b.mountpoint) return 1
  return 0
}

// export const makeKey = (...val) => val.join('')

export const getId = d => [d.mountpoint, d.uuid, d.rvid, d.computer.uuid, d.computer.name, d.computer.domain, d.computer.user].join('>')
export const isSameDisk = (a, b) => a && b && a.id === b.id
