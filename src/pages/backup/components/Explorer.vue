<template>
  <div class="bkit-explorer relative-position">
    <q-toolbar class="bkit-toolbar justify-center" v-if="rvid">
      <keep-alive>
        <snaps :rvid="rvid" :snap.sync="snap" ref="snaps"></snaps>
      </keep-alive>
    </q-toolbar>
    <q-toolbar inset v-if="isReady2Show">
      <q-breadcrumbs gutter="xs" separator-color="amber" :separator="sep">
        <q-breadcrumbs-el
          v-if="steps.length > 0"
          style="cursor:pointer"
          @click="stepto(0)"
          :label="drive"
          icon="far fa-hdd"/>
        <q-breadcrumbs-el
          style="cursor:pointer"
          v-for="(step, index) in steps" :key="index"
          @click="stepto(1 + index)"
          :label="step"/>
      </q-breadcrumbs>
    </q-toolbar>
    <q-splitter
      v-if="isReady2Show"
      class="bkit-splitter"
      :limits="[0, 80]"
      v-model="verticalSplitter">

      <template v-slot:before>
        <q-list class="rounded-borders">
          <tree
            :entry="root"
            :mountpoint="mountpoint"
            :rvid="rvid"
            :snap="snap"
            :displayNode.sync="currentPath"
            :selected.sync="selectedNode"
            @restore="(...args) => $emit('restore', ...args)"
            @backup="(...args) => $emit('backup', ...args)"
            @show="show"/>
        </q-list>
      </template>

      <template v-slot:after>
        <div>
          <transition name="loading">
            <div v-show="loading" class="bkit-loading row justify-center relative-position">
              <q-spinner-ios color="amber" class="q-my-md"/>
              <div class="q-my-md q-ml-xs">{{loading}}...</div>
            </div>
          </transition>
          <div class="q-pa-xs row justify-evenly q-gutter-sm relative-position">
            <item
              v-for="(entry, index) in currentFiles"
              :key="index"
              v-bind="entry"
              @open="show"
              @usesnap="usesnap"
              @restore="restore"
              @recover="recover"
              @backup="backup"
            />
          </div>
        </div>
      </template>
    </q-splitter>
  </div>
</template>
<script>

// import { warn } from 'src/helpers/notify'
import { listLastDir, diffLastDir } from 'src/helpers/bkit'
import { Resource } from 'src/helpers/types'

import tree from './tree'
import item from './item'
import snaps from './Snaps'
// import fs from 'fs-extra'
const { relative, join, sep, dirname, posix } = require('path')
const fs = require('fs')
const slash = require('slash')

function comparenames (a, b) {
  if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
  if (a.name.toLowerCase() > b.name.toLowerCase()) return 1
  return 0
}
function compare (a, b) {
  if (a.isdir && b.isdir) return comparenames(a, b)
  else if (a.isdir) return -1
  else if (b.isdir) return 1
  else return comparenames(a, b)
}

import { readdir } from 'src/helpers/readfs'

const { chokidar, chokidarOptions } = require('src/helpers/chockidar')

// const listdir = bkit.enqueueListdir('Listdir on localexplorer')
// const dkit = bkit.enqueuedkit('dKit on localexplorer')

const unixPath = (base, path) => {
  let upath = base ? relative(base, path) : path
  upath = slash(posix.normalize(`/${upath}/`))
  return posix.normalize(upath)
}

const { dialog, app } = require('electron').remote
let download = app.getPath('downloads') || app.getPath('temp')

export default {
  name: 'localexplorer',
  data () {
    return {
      verticalSplitter: 55,
      watcher: undefined,
      sep: sep,
      selectedNode: false,
      currentPath: '',
      loading: false,
      currentFiles: [],
      invalidateCache: false,
      diskEvent: '',
      snap: undefined
    }
  },
  props: {
    mountpoint: {
      type: String,
      default: ''
    },
    rvid: {
      type: String,
      default: undefined
    }
  },
  components: {
    snaps,
    tree,
    item
  },
  computed: {
    root () {
      const [isdir, isroot, path] = [true, true, this.mountpoint]
      const onbackup = !!this.snap
      const onlocal = !!this.mountpoint
      return { isdir, isroot, path, onbackup, onlocal }
    },
    isReady2Show () {
      return this.snap !== undefined || !this.rvid
    },
    steps () {
      const rel = relative(this.mountpoint, this.currentPath)
      return this.currentPath !== '' ? `${rel}`.split(sep) : []
    },
    drive () {
      return this.mountpoint.replace(/[\\/]+$/, '')
    },
    token () {
      // token depends on snap, rvid, current path and any diskevent
      return [this.snap, this.rvid, this.currentPath, this.diskEvent].join('|')
    }
  },
  watch: {
    token () {
      if (this.rvid && this.snap === undefined) return // Don't refresh yet. Wait until snaps has retrieved
      this.refresh(this.currentPath)
    },
    currentPath: {
      immediate: true,
      async handler (dir, oldir) {
        this.currentFiles = []
        if (this.mountpoint) { // only if is a local drive/disk
          if (this.watcher) {
            await this.watcher.close()
            this.watcher.add(dir)
          } else {
            this.watcher = chokidar.watch(dir, chokidarOptions)
          }
          this.watcher.on('all', (event, path) => {
            this.diskEvent = [event, path].join('|')
            console.log('Event', this.diskEvent)
            this.invalidateCache = true
          })
        }
      }
    },
    snap: function () {
      // this.currentFiles = []
    }
  },
  mounted () {
    // this.show(this.mountpoint)
    // console.log('mountpoint', this.mountpoint)
  },
  methods: {
    usesnap (snap) {
      this.snap = snap
    },
    stepto (index) {
      const fullpath = join(this.mountpoint, this.steps.slice(0, index).join('/'))
      console.log('Go to', fullpath)
      this.show(fullpath)
    },
    show (fullpath) {
      this.currentPath = fullpath
    },
    updateCurrentFiles (entry) {
      entry.token = this.token
      const currentFiles = this.currentFiles
      const index = currentFiles.findIndex(e => e.path === entry.path)
      if (index >= 0) {
        const file = { ...currentFiles[index], ...entry }
        currentFiles.splice(index, 1, file)
      } else {
        currentFiles.push(entry)
      }
      currentFiles.sort(compare)
    },
    cleanup () {
      let i = this.currentFiles.length
      while (i--) {
        if (this.currentFiles[i].token !== this.token) {
          this.currentFiles.splice(i, 1) // remove it from list
        }
      }
    },
    markFiltered () {
      this.currentFiles.filter(e => !e.checked).forEach(e => {
        e.isfiltered = true
        e.checked = true
      })
    },
    async load (fullpath) {
      if (!this.mountpoint || !fs.existsSync(fullpath)) return
      this.loading = 'Reading local disk'
      for await (const entry of readdir(fullpath)) {
        entry.checked = false
        // prevent the situation where dir path is no longer the current path
        if (this.currentPath === fullpath) this.updateCurrentFiles(entry)
      }
      this.loading = false
    },
    async refresh (fullpath) {
      if (!fullpath) return
      await this.load(fullpath)
      await this.readDirOnBackup(fullpath)
      await this.comparedir(fullpath)
      this.markFiltered()
      this.cleanup()
    },
    async comparedir (fullpath) {
      const { snap, path, mountpoint, rvid } = this
      if (!fs.existsSync(fullpath) || !rvid || !snap || this.currentPath !== fullpath) return
      this.loading = 'Comparing with backup'
      const invalidateCache = this.invalidateCache
      return diffLastDir(fullpath, snap, { invalidateCache })
        .then(entries => {
          entries.forEach(entry => {
            // ignore all parents and the mountpoint
            if (dirname(entry.path) !== fullpath || entry.path === mountpoint) return
            entry.checked = true
            if (this.currentPath === fullpath) this.updateCurrentFiles(entry)
          })
          this.invalidateCache = false
        })
        .catch(err => {
          if (err.name && err.name === 'Replaced') {
            console.log(`diffLastDir [${err.name}] ${err.message} for ${snap}[${path}]`)
          } else {
            console.error('Catch in diffLastDir', err.name, err.message, err)
          }
        })
        .finally(() => (this.loading = false))
    },
    async readDirOnBackup (fullpath) {
      const { snap, rvid, path, mountpoint, currentFiles } = this
      // Only if it still the current path and a Remote Volume (rvid) and snap exists
      // Otherwise mark is as checked and return
      if (!rvid || !snap || this.currentPath !== fullpath) {
        return currentFiles.forEach(e => {
          e.checked = e.nobackup = true
        }) // mark files as cheched and with no backup
      }
      // console.log(`Check ${fullpath} status on server`)

      this.loading = 'Reading backup'

      const upath = unixPath(mountpoint, fullpath)

      return listLastDir(upath, snap, rvid)
        .then(dirs => {
          dirs.forEach(entry => {
            entry.path = join(fullpath, entry.name)
            entry.checked = true
            if (this.currentPath === fullpath) this.updateCurrentFiles(entry)
          })
        })
        .catch(err => {
          if (err.name && err.name === 'Replaced') {
            console.log(`listLastDir [${err.name}] ${err.message} for ${snap}[${path}]`)
          } else {
            console.error('Catch in listLastDir', err.name, err.message, err)
          }
        })
        .finally(() => (this.loading = false))
    },
    backup (path) {
      this.$emit('backup', path, (a) => {
        console.log('Ba ckup done for', a)
        this.$refs.snaps.reload()
      })
    },
    restore (path) {
      const { snap, rvid, mountpoint } = this
      if (!mountpoint) path = unixPath('', path)
      this.$emit('restore', new Resource({ path, snap, rvid }))
    },
    recover (path) {
      const { snap, rvid, mountpoint } = this
      path = unixPath(mountpoint, path)
      dialog.showOpenDialog({
        title: 'Where do you want to recover your data',
        defaultPath: download,
        buttonLabel: 'Recover to here',
        properties: ['openDirectory', 'promptToCreate']
      }).then((result) => {
        if (result.filePaths instanceof Array) {
          download = result.filePaths[0]
          if (download !== null) {
            const options = [`--dst=${download}`]
            this.$emit('recover', new Resource({ path, snap, rvid, options }))
          }
        }
      }).catch((err) => {
        download = null
        console.error('Catch on showOpenDialog', err)
      }).finally(() => {
        // console.log('')
      })
    }

  }
}

</script>

<style scoped lang="scss">
  $bkitsize: 6em;
  .bkit-explorer {
    height:100%;
    display: flex;
    flex-direction: column;
    overflow-y:hidden;
    .bkit-toolbar {
      flex-shrink:0 ;
    }
    .bkit-splitter {
      flex-shrink: 1;
      flex-grow: 1;
      overflow-y: hidden;
    }
  }
</style>

<style lang="scss">
  .bkit-loading {
    height: 3em;
  }
  .loading-leave-active {
    transition: margin-top .6s ease-in-out;
    opacity: 0;
  }
  .loading-leave-to {
    margin-top: -3em;
  }
</style>