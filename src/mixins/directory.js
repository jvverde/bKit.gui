import fs from 'fs'
import { readdir } from 'src/helpers/readfs'
import { chokidar, chokidarOptions } from 'src/helpers/chockidar'
import { listPath as listRemoteDir } from 'src/helpers/api'
import path from 'path'
import { warn } from 'src/helpers/notify'

const exists = async (pathname) => fs.promises.access(pathname, fs.constants.F_OK)

const bkitPath = (base, fullpath) => {
  let upath = base ? path.relative(base, fullpath) : fullpath
  return path.normalize(upath).split(path.sep).join(path.posix.sep)
}

export class Entry {
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
    const hasDifferenttimes = times instanceof Array && Math.floor(times[0] / 1000) !== Math.floor(times[1] / 1000)
    if (isdir) {
      return hasDifferenttimes
    } else return 'size' in diff || hasDifferenttimes
  }
  get updated () {
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

const diff = (a = {}, b = {}) => {
  const keys = Object.keys(a)
  const r = {}
  keys.forEach(k => {
    if (a[k] !== b[k]) {
      r[k] = [a[k], b[k]]
    }
  })
  return r
}

const join = (a, b) => {
  const d = { diff: diff(a.stat, b.stat) }
  const r = { ...b, ...a, ...d }
  return r
}

export default {
  data () {
    return {
      localEntries: {},
      backupEntries: {},
      watcher: undefined,
      remoteloading: false,
      localloading: false
    }
  },
  props: {
    fullpath: {
      type: String,
      required: true
    },
    mountpoint: {
      type: String,
      default: ''
    },
    rvid: {
      type: String,
      default: ''
    },
    snap: {
      type: String,
      default: ''
    }
  },
  computed: {
    endpoint () {
      return [this.snap, this.rvid, this.mountpoint, this.fullpath]
    },
    secured () {
      const { localEntries, backupEntries } = this
      const keys = Object.keys(localEntries)
      return keys.filter(k => backupEntries[k] instanceof Object).map(k => new Entry(join(localEntries[k], backupEntries[k])))
    },
    onlyLocal () {
      const { localEntries, backupEntries } = this
      const keys = Object.keys(localEntries)
      return keys.filter(k => !(backupEntries[k] instanceof Object)).map(k => new Entry(localEntries[k]))
    },
    onlyBackup () {
      const { backupEntries, localEntries } = this
      const keys = Object.keys(backupEntries)
      return keys.filter(k => !(localEntries[k] instanceof Object)).map(k => new Entry(backupEntries[k]))
    },
    entries () {
      const r = [...this.secured, ...this.onlyLocal, ...this.onlyBackup]
      // console.log('Entries', r)
      return r
    }
  },
  watch: {
    endpoint: {
      immediate: true,
      deep: true,
      async handler (endpoint, old) {
        // console.log('New endpoint', endpoint)
        await this.readRemoteDir()
      }
    },
    fullpath: {
      immediate: true,
      async handler (dir, oldir) {
        // console.log('New fullpath', dir)
        try {
          await exists(dir)
          await this.readLocalDir()
          await this.installWatcher()
        } catch (err) {
          warn(err, false)
        }
      }
    }
  },
  mounted () {
  },
  methods: {
    async readLocalDir () {
      try {
        this.localloading = 'Reading local disk'
        const fullpath = this.fullpath
        console.log('readLocalDir', fullpath)
        await exists(fullpath)
        const entries = await readdir(fullpath) // readdir is an async generator
        const localEntries = {}
        for await (const entry of entries) {
          entry.onlocal = true
          entry.mountpoint = this.mountpoint
          localEntries[entry.name] = entry
        }
        if (fullpath === this.fullpath) this.localEntries = localEntries
      } catch (err) {
        warn(err, false)
      } finally {
        this.localloading = false
      }
    },
    async readRemoteDir () {
      try {
        this.remoteloading = 'Reading backup'
        const { snap, rvid, fullpath, mountpoint } = this
        if (!snap || !rvid) return
        const upath = bkitPath(mountpoint, fullpath)
        console.log('readRemoteDir', upath)
        const entries = await listRemoteDir(rvid, snap, upath)
        if (fullpath !== this.fullpath) return
        const backupEntries = {}
        entries.forEach(entry => {
          entry.onbackup = true
          backupEntries[entry.name] = entry
        })
        this.backupEntries = backupEntries
      } catch (err) {
        warn(err, false)
      } finally {
        this.remoteloading = false
      }
    },
    async installWatcher () {
      if (this.watcher) {
        await this.watcher.close()
        console.log('Add watcher', this.fullpath)
        this.watcher.add(this.fullpath)
      } else {
        console.log('Start Watcher', this.fullpath)
        this.watcher = chokidar.watch(this.fullpath, chokidarOptions)
      }
      this.watcher.on('all', (event, path) => {
        this.diskEvent = [event, path].join('|')
        console.log('Event', this.diskEvent)
        this.readLocalDir()
      }).on('error', error => warn(`Watcher error: ${error} on path ${this.fullpath}`, false))
    }
  },
  async beforeDestroy () {
    try {
      await this.watcher.close()
      console.log(`Whatcher on ${this.fullpath} closed`)
    } catch (err) {
      warn(err, false)
    }
  }
}
