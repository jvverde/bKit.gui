// import fs from 'fs'
import { readdir } from 'src/helpers/readfs'
import { chokidar, chokidarOptions } from 'src/helpers/chockidar'
import { listPath as listRemoteDir } from 'src/helpers/api'
import path from 'path'
import Entry from 'src/helpers/entry'
import { warn } from 'src/helpers/notify'

import { mapGetters } from 'vuex'
import { pInfo } from 'src/boot/computer'

// const exists = async (pathname) => fs.promises.access(pathname, fs.constants.F_OK)
// const rescape = s => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')

const bkitPath = (base, fullpath) => {
  let upath = base ? path.relative(base, fullpath) : fullpath
  return path.normalize(upath).split(path.sep).join(path.posix.sep)
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
      localloading: false,
      computer: {
        name: undefined,
        domain: undefined,
        uuid: undefined,
        user: undefined
      }
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
    ...mapGetters('client', ['getCurrentClient']),
    done () {
      return !this.remoteloading && !this.localloading
    },
    endpoint () {
      return [this.snap, this.rvid, this.mountpoint, this.fullpath]
    },
    localBackuped () { /* Local Files/Dirs on backup */
      const { localEntries, backupEntries } = this
      const keys = Object.keys(localEntries)
      /* Filter keys by ones whom also are keys of backupEntries, and then joins both entries properties */
      return keys.filter(k => backupEntries[k] instanceof Object).map(k => new Entry(join(localEntries[k], backupEntries[k])))
    },
    onlyLocal () { /* Local Files/Dirs NOT on backup */
      const { localEntries, backupEntries } = this
      const keys = Object.keys(localEntries)
      return keys.filter(k => !(backupEntries[k] instanceof Object)).map(k => new Entry(localEntries[k]))
    },
    onlyBackup () { /* Files/Dirs on backup but no stored locally (previous delete!?) */
      const { backupEntries, localEntries } = this
      const keys = Object.keys(backupEntries)
      return keys.filter(k => !(localEntries[k] instanceof Object)).map(k => new Entry(backupEntries[k]))
    },
    entries () { // All of them
      return [...this.localBackuped, ...this.onlyLocal, ...this.onlyBackup].map(e => {
        e.done = this.done
        return e
      })
    }
  },
  watch: {
    endpoint: {
      immediate: true,
      deep: true,
      async handler (endpoint, old) {
        // console.log('New endpoint', endpoint)
        try {
          await this.readRemoteDir()
        } catch (err) {
          warn(err, false)
        } finally {
          // console.log(this.entries)
        }
      }
    },
    fullpath: {
      immediate: true,
      async handler (dir, oldir) {
        console.log('New fullpath', dir)
        try {
          // await exists(dir)
          await this.readLocalDir()
          await this.installWatcher()
        } catch (err) {
          warn(err, false)
        } finally {
        }
      }
    }
  },
  async mounted () {
    const { computer, localUser: user } = await pInfo
    this.computer = { ...computer, user }
  },
  methods: {
    async readLocalDir () {
      this.localEntries = {}
      const localEntries = {}
      const { fullpath, mountpoint } = this
      if (!mountpoint) return
      try {
        this.localloading = 'Reading local disk'
        // await exists(fullpath)
        console.log('ReadLocalDir', fullpath)
        const entries = await readdir(fullpath) // readdir is an async generator
        for await (const entry of entries) { // as it is a generator we need to use await
          entry.onlocal = true
          entry.mountpoint = this.mountpoint
          entry.computer = this.computer
          localEntries[entry.name] = entry
        }
      } catch (err) {
        warn(err, false)
      } finally {
        this.localloading = false
        // Forget if meanwhile this.fullpath changed
        if (fullpath === this.fullpath) this.localEntries = localEntries
      }
    },
    async readRemoteDir () {
      this.backupEntries = {}
      const backupEntries = {}
      const { snap, rvid, fullpath, mountpoint } = this
      if (!snap || !rvid) return
      const computer = this.getCurrentClient
      try {
        this.remoteloading = 'Reading backup'
        const upath = bkitPath(mountpoint, fullpath)
        console.log('ReadRemoteDir', upath, rvid, snap)
        const entries = await listRemoteDir(rvid, snap, upath)
        // if (fullpath !== this.fullpath) return // Forget if meanwhile this.fullpath changed
        entries.forEach(entry => {
          entry.onbackup = true
          // This 2 lines are required for cases where a local entry was deleted
          entry.path = entry.path || path.join(fullpath, entry.name)
          entry.mountpoint = entry.mountpoint || mountpoint
          entry.computer = computer
          backupEntries[entry.name] = entry
        })
      } catch (err) {
        warn(err, false)
      } finally {
        this.remoteloading = false
        // Forget if meanwhile this.fullpath changed
        if (fullpath === this.fullpath) this.backupEntries = backupEntries
      }
    },
    async installWatcher () {
      if (!this.mountpoint) return
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
      if (this.watcher) {
        await this.watcher.close()
        console.log(`Whatcher on ${this.fullpath} closed`)
      }
    } catch (err) {
      warn(err, false)
    }
  }
}
