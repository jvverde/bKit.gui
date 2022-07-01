import fs from 'fs'
import { readdir } from 'src/helpers/readfs'
import { chokidar, chokidarOptions } from 'src/helpers/chockidar'
import { listPath as listRemoteDir } from 'src/helpers/api'
import path from 'path'
import Entry from 'src/helpers/entry'
import { warn } from 'src/helpers/notify'

const exists = async (pathname) => fs.promises.access(pathname, fs.constants.F_OK)

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
      const r = [...this.localBackuped, ...this.onlyLocal, ...this.onlyBackup]
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
      this.localEntries = {}
      try {
        this.localloading = 'Reading local disk'
        const fullpath = this.fullpath
        console.log('readLocalDir', fullpath)
        await exists(fullpath)
        const entries = await readdir(fullpath) // readdir is an async generator
        const localEntries = {}
        for await (const entry of entries) { // as it is a generator we need to use await
          entry.onlocal = true
          entry.mountpoint = this.mountpoint
          localEntries[entry.name] = entry
        }
        // Forget if meanwhile this.fullpath changed
        if (fullpath === this.fullpath) this.localEntries = localEntries
      } catch (err) {
        warn(err, false)
      } finally {
        this.localloading = false
      }
    },
    async readRemoteDir () {
      this.backupEntries = {}
      try {
        this.remoteloading = 'Reading backup'
        const { snap, rvid, fullpath, mountpoint } = this
        if (!snap || !rvid) return
        const upath = bkitPath(mountpoint, fullpath)
        console.log('readRemoteDir', upath)
        const entries = await listRemoteDir(rvid, snap, upath)
        if (fullpath !== this.fullpath) return // Forget if meanwhile this.fullpath changed
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
