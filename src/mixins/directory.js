import fs from 'fs'
import { readdir } from 'src/helpers/readfs'
import { chokidar, chokidarOptions } from 'src/helpers/chockidar'
import { listPath as listRemoteDir } from 'src/helpers/api'
import { relative, normalize } from 'path'

const exists = async (pathname) => fs.promises.access(pathname, fs.constants.F_OK)

const bkitPath = (base, path) => {
  let upath = base ? relative(base, path) : path
  return normalize(upath)
}

export default {
  data: function () {
    return {
      localEntries: [],
      remoteEntries: [],
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
      return [this.snap, this.rvid, this.mountpoint]
    },
    backups () {
      const { localEntries, remoteEntries } = this
      return localEntries.filter(le => remoteEntries.some(re => re.name === le.name))
    },
    nobackups () {
      const { localEntries, backups } = this
      return localEntries.filter(le => backups.every(ie => ie.name !== le.name))
    },
    nolocals () {
      const { remoteEntries, backups } = this
      return remoteEntries.filter(re => backups.every(ie => ie.name !== re.name))
    },
    entries () {
      const r = [...this.nobackups, ...this.backups, ...this.nolocals]
      return r
    }
  },
  watch: {
    endpoint: {
      immediate: true,
      deep: true,
      async handler (endpoint, old) {
        console.log('New endpoint', endpoint)
        await this.readRemoteDir()
      }
    },
    fullpath: {
      immediate: true,
      async handler (dir, oldir) {
        console.log('New fullpath', dir)
        try {
          await exists(dir)
          await this.readLocalDir()
          await this.installWatcher()
        } catch (err) {
          console.log(err)
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
        this.localEntries = []
        for await (const entry of entries) {
          if (fullpath !== this.fullpath) return
          this.localEntries.push({ ...entry, onlocal: true })
        }
      } catch (err) {
        console.error(err)
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
        console.log('upath', upath)
        const entries = await listRemoteDir(rvid, snap, upath)
        if (fullpath !== this.fullpath) return
        this.remoteEntries = entries.map(e => ({ ...e, onbackup: true }))
      } catch (err) {
        console.log(err)
      } finally {
        this.remoteloading = false
      }
    },
    async installWatcher () {
      if (this.watcher) {
        await this.watcher.close()
        this.watcher.add(this.fullpath)
      } else {
        this.watcher = chokidar.watch(this.fullpath, chokidarOptions)
      }
      this.watcher.on('all', (event, path) => {
        this.diskEvent = [event, path].join('|')
        console.log('Event', this.diskEvent)
        this.readLocalDir()
      })
    }
  }
}
