// import { listPath as listRemoteDir } from 'src/helpers/api'
import { listRemoteDir } from 'src/helpers/api'
import Entry from 'src/helpers/entry'
import { warn } from 'src/helpers/notify'

import { mapGetters } from 'vuex'
import { pInfo } from 'src/boot/computer'

const { readdir, path } = window.electron

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
    ...mapGetters('clients', ['getCurrentClient']),
    done () {
      return !this.remoteloading && !this.localloading
    },
    endpoint () {
      const { snap, rvid, mountpoint, fullpath } = this
      return { snap, rvid, mountpoint, fullpath }
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
      handler () {
        this.$nextTick(() => { // Not so fast. Give a chance to other parameters to change too. Avoid useless requests
          this.readRemoteDir()
        })
      }
    },
    fullpath: {
      immediate: true,
      async handler (val, old) {
        try {
          if (this.watcher != undefined && old) {
            this.removeWatcher(old, this.watcher)
          }
          await this.readLocalDir()
          this.installWatcher()
        } catch (err) {
          warn(err, false)
        }
      }
    }
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
        const entries = await readdir(fullpath)
        for (const entry of entries) { // as it is a generator we need to use await
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
    installWatcher () {
      if (!this.mountpoint) return
      try {
        this.watcher = window.electron.watchfiles(this.fullpath, () => {
          this.readLocalDir()
        })
      } catch (e) {
        warn(e)
      }
    },
    removeWatcher (fullpath, id) {
      try {
        if (fullpath && undefined !== id) {
          window.electron.unwatchfiles(fullpath, id)
        }
      } catch (err) {
        warn(err, false)
      }
    }
  },
  async mounted () {
    const { computer, localUser: user } = await pInfo
    this.computer = { ...computer, user }
  },
  beforeDestroy () {
    this.removeWatcher(this.fullpath, this.watcher)
  }
}
