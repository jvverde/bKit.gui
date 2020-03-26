<template>
  <div class="bkit-explorer relative-position">
    <q-toolbar class="bkit-toolbar" v-if="rvid">
      <keep-alive>
        <snaps :rvid="rvid" v-on:usesnap="usesnap"></snaps>
      </keep-alive>
    </q-toolbar>
    <q-toolbar inset>
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
            @show="show"/>
        </q-list>
      </template>

      <template v-slot:after>
        <div class="q-pa-md row justify-evenly q-gutter-md items-stretch relative-position">
          <item
            v-for="entry in currentFiles"
            :key="entry.path"
            v-bind="entry"
            @open="show"
            class="column"/>
          <q-inner-loading :showing="loading">
            <q-spinner-ios size="100px" color="primary"/>
          </q-inner-loading>
        </div>
      </template>
    </q-splitter>
  </div>
</template>
<script>

// import { warn } from 'src/helpers/notify'
import { listLastDir, diffLastDir } from 'src/helpers/bkit'
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
const chokidar = require('chokidar')
const chokidarOptions = {
  depth: 0,
  ignoreInitial: true,
  atomic: true,
  ignorePermissionErrors: true,
  persistent: true
}

// const listdir = bkit.enqueueListdir('Listdir on localexplorer')
// const dkit = bkit.enqueuedkit('dKit on localexplorer')

export default {
  name: 'localexplorer',
  data () {
    const [isdir, isroot, path] = [true, true, this.mountpoint]
    const onbackup = !!this.rvid
    return {
      verticalSplitter: 55,
      watcher: undefined,
      sep: sep,
      selectedNode: false,
      currentPath: '',
      loading: false,
      currentFiles: [],
      root: { isdir, isroot, path, onbackup },
      snap: ''
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
  watch: {
    currentPath: async function (dir, oldir) {
      console.log(`${this.currentPath} [${oldir} => ${dir}]`)
      this.currentFiles = []
      this.load(dir)
      if (this.mountpoint) { // only if is a local drive/disk
        if (this.watcher) {
          await this.watcher.close()
          this.watcher.add(dir)
        } else {
          this.watcher = chokidar.watch(dir, chokidarOptions)
        }
        this.watcher.on('all', (event, path) => {
          this.load(dir)
        })
      }
    }
  },
  computed: {
    steps: function () {
      const rel = relative(this.mountpoint, this.currentPath)
      return this.currentPath !== '' ? `${rel}`.split(sep) : []
    },
    drive: function () {
      return this.mountpoint.replace(/[\\/]+$/, '')
    }
  },
  mounted () {
    this.show(this.mountpoint)
  },
  methods: {
    usesnap (snap, rvid) {
      this.snap = snap
      console.log('usesnap', snap, rvid)
    },
    stepto (index) {
      const fullpath = join(this.mountpoint, this.steps.slice(0, index).join('/'))
      console.log('go to', fullpath)
      this.show(fullpath)
    },
    show (fullpath) {
      this.currentPath = fullpath
    },
    async load (fullpath) {
      console.log('Load', fullpath)
      const currentFiles = this.currentFiles = []
      this.loading = true
      for await (const entry of readdir(fullpath)) {
        entry.checked = false
        // prevent the situation where dir path is no longer the current path
        if (this.currentPath === fullpath) currentFiles.push(entry)
      }
      this.loading = false
      currentFiles.sort(compare)
      this.checkdir(fullpath)
    },
    refresh (entries) {
      entries.sort(compare)
      this.currentFiles = [...entries]
      // console.log(this.currentFiles)
    },
    refreshNextTick (currentFiles = this.currentFiles) {
      this.currentFiles = []
      return this.$nextTick(() => {
        this.refresh(currentFiles)
      })
    },
    async checkdir (fullpath) {
      const { snap, rvid, path, mountpoint, currentPath, currentFiles } = this
      if (!rvid) return
      if (currentPath !== fullpath) return // only if it still the current path
      // console.log(`Check ${fullpath} status on server`)

      this.loading = true

      let mountRelative = mountpoint ? relative(mountpoint, fullpath) : fullpath
      mountRelative = slash(posix.normalize(`/${mountRelative}/`))
      mountRelative = posix.normalize(mountRelative)

      // const dirs = await listDirs(relative, args)
      const addchildren = (entry) => {
        entry.checked = true
        const index = currentFiles.findIndex(e => e.path === entry.path)
        if (index > -1) {
          const newentry = { ...currentFiles[index], ...entry }
          currentFiles.splice(index, 1, newentry)
        } else {
          currentFiles.push(entry)
        }
      }
      await listLastDir(mountRelative, snap, rvid)
        .then(dirs => {
          dirs.forEach(entry => {
            entry.path = join(fullpath, entry.name)
            addchildren(entry)
          })
        })
        .catch(err => {
          if (err.name && err.name === 'Replaced') {
            console.log(`listLastDir [${err.name}] ${err.message} for ${snap}[${path}]`)
          } else {
            console.error('Catch', err.name, err.message, err)
          }
        })
        .finally(() => (this.loading = false))

      if (fs.existsSync(fullpath)) { // call diffDir only if the dir exists on local disk
        this.loading = true
        await diffLastDir(fullpath, snap)
          .then(entries => {
            entries.forEach(entry => {
              if (dirname(entry.path) !== fullpath || entry.path === mountpoint) {
                // ignore all parents and the mountpoint
                console.log('Discard dir', entry.path)
                return
              }
              addchildren(entry)
            })
          })
          .catch(err => {
            if (err.name) console.warn(`diffLastDir [${err.name}] ${err.message} for ${snap}[${path}]`)
            else throw err
          })
          .finally(() => (this.loading = false))
      }
      currentFiles.sort(compare)
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
  .bkit-explorer{
    .bkit-splitter {
      .q-icon {
        // font-size: initial;
      }
    }
  }
</style>
