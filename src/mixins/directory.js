import axios from 'axios'
import fs from 'fs'
import { chokidar, chokidarOptions } from 'src/helpers/chockidar'
import { listPath as listRemoteDir } from 'src/helpers/api'
import { relative, normalize } from 'path'

const find = pathname => fs.promises.access(pathname, fs.constants.F_OK)

const bkitPath = (base, path) => {
  let upath = base ? relative(base, path) : path
  return normalize(upath)
}

export const Directory = {
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
    }
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
    endpoint () { return [this.snap, this.rvid, this.mountpoint] }
  },
  watch: {
    endpoint: {
      immediate: true,
      deep: true,
      async handler (endpoint, old) {
        await this.readRemoteDir()  
      }
    }
    fullpath: {
      immediate: true,
      async handler (dir, oldir) {
        // this.currentFiles = []
        const exists = dir && await find(dir)
        if (exits) { // only if is a local drive/disk
          await this.readLocalDir()
          if (this.watcher) {
            await this.watcher.close()
            this.watcher.add(dir)
          } else {
            this.watcher = chokidar.watch(dir, chokidarOptions)
          }
          this.watcher.on('all', (event, path) => {
            this.diskEvent = [event, path].join('|')
            console.log('Event', this.diskEvent)
            this.readLocalDir()
          })
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
        const exists = fullpath && await find(fullpath)
        if (!exists) return
        const entries = await readdir(fullpath)
        if (fullpath !== this.fullpath) return
        this.localEntries = entries.map(e => { ...e, onlocal: true })
      } catch (err) {
        console.error(err)
      } finally {
        this.localloading = false        
      }
    },
    async readRemoteDir () {
      try {
        const { snap, rvid, fullpath, mountpoint } = this
        if (!snap || !rvid ) return
        const upath = bkitPath(mountpoint, fullpath)
        const entries = await listRemoteDir(rvid, snap, upath)
        if (fullpath !== this.fullpath) return
        this.remoteEntries = entries.map(e => { ...e, onbackup: true })
      } catch (err) {
        console.log(err)
      } finally {
        this.remoteloading = false
      }
    }
  }
}
