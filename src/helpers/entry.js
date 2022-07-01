// Define class entry to represent a dir or a file

const getSeconds = ms => Math.floor(ms / 1000)

export default class Entry {
  constructor (obj) {
    Object.assign(this, obj)
  }
  get hasBackup () {
    return this.remote instanceof Object
  }
  get onBoth () {
    return !!this.onlocal && !!this.onbackup
  }
  get onlyLocal () {
    return !!this.onlocal && !this.onbackup
  }
  get onlyBackup () {
    return !this.onlocal && !!this.onbackup
  }
  get isdir () {
    return this.type === 'd'
  }
  get isnotdir () {
    return this.type !== 'd'
  }
  get isfile () {
    return this.type === 'f'
  }
  get needUpdate () {
    const { diff, isdir } = this
    if (!diff) return undefined
    const times = diff['mtimeMs']
    if (!(times instanceof Array && times.length >= 2)) return undefined
    const hasDifferenttimes = getSeconds(times[0]) !== getSeconds(times[1])
    if (isdir) {
      return hasDifferenttimes
    } else return 'size' in diff || hasDifferenttimes
  }
  get updated () {
    // A entry is updated if it exist in both sides and not need an update
    return !!this.onBoth && !this.needUpdate
  }
  get snap () {
    const { remote } = this
    if (remote) return remote.snap
    return undefined
  }
  get rvid () {
    const { remote } = this
    if (remote) return remote.rvid
    return undefined
  }
  get fullpath () {
    return this.path
  }
}
