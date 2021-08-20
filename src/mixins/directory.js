import fs from 'fs'
import { readdir } from 'src/helpers/readfs'
import { chokidar, chokidarOptions } from 'src/helpers/chockidar'
import { listPath as listRemoteDir } from 'src/helpers/api'
import { relative, normalize } from 'path'
import { onMounted } from 'vue'

const exists = async (pathname) => fs.promises.access(pathname, fs.constants.F_OK)

const bkitPath = (base, path) => {
  let upath = base ? relative(base, path) : path
  return normalize(upath)
}

export default {
  setup () {
    // mounted
    console.log('TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT')
    onMounted(() => {
      console.log('Component ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ is mounted!')
    })
    return {
      teste: 3
    }
  },
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
      return [this.snap, this.rvid, this.mountpoint]
    },
    secured () {
      const { localEntries, backupEntries } = this
      const keys = Object.keys(localEntries)
      return keys.filter(k => backupEntries[k] instanceof Object).map(k => localEntries[k])
    },
    onlyLocal () {
      const { localEntries, secured } = this
      const keys = Object.keys(localEntries)
      return keys.filter(k => !(secured[k] instanceof Object)).map(k => localEntries[k])
    },
    onlyBackup () {
      const { backupEntries, secured } = this
      const keys = Object.keys(backupEntries)
      return keys.filter(k => !(secured[k] instanceof Object)).map(k => backupEntries[k])
    },
    entries () {
      const r = [...this.secured, ...this.onlyLocal, ...this.onlyBackup]
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
    console.log('Mounted this.teste', this.teste)
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
          localEntries[entry.name] = entry
        }
        if (fullpath === this.fullpath) this.localEntries = localEntries
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
        const backupEntries = {}
        entries.forEach(entry => {
          entry.onbackup = true
          backupEntries[entry.name] = entry
        })
        this.backupEntries = backupEntries
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
