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
            v-for="entry in currentfiles"
            :key="entry.path"
            v-bind="entry"
            @open="show"
            class="column"/>
          <q-inner-loading :showing="isloading">
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
      loading: 0,
      currentfiles: [],
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
    isloading () {
      return this.loading !== 0
    },
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
      const currentfiles = this.currentfiles = []
      this.loading++
      for await (const entry of readdir(fullpath)) {
        entry.checked = false
        // prevent the situation where dir path is no longer the current path
        if (this.currentPath === fullpath) currentfiles.push(entry)
      }
      this.loading--
      currentfiles.sort(compare)
      this.checkdir(fullpath)
    },
    refresh (entries) {
      entries.sort(compare)
      this.currentfiles = [...entries]
      // console.log(this.currentfiles)
    },
    refreshNextTick (currentfiles = this.currentfiles) {
      this.currentfiles = []
      return this.$nextTick(() => {
        this.refresh(currentfiles)
      })
    },
    async checkdir (fullpath) {
      const { snap, rvid, path, mountpoint, currentPath, currentfiles } = this
      if (!rvid) return
      if (currentPath !== fullpath) return // only if it still the current path
      // console.log(`Check ${fullpath} status on server`)

      this.loading = true

      let mountRelative = mountpoint ? relative(mountpoint, fullpath) : fullpath
      mountRelative = slash(posix.normalize(`/${mountRelative}/`))
      mountRelative = posix.normalize(mountRelative)

      // const dirs = await listDirs(relative, args)
      await listLastDir(mountRelative, snap, rvid)
        .then(dirs => {
          dirs.forEach(entry => {
            if (currentPath !== fullpath) return // only if it still the current path
            entry.checked = true
            const index = currentfiles.findIndex(e => e.path === entry.path)
            if (index > -1) {
              const newentry = { ...currentfiles[index], ...entry }
              currentfiles.splice(index, 1, newentry)
            } else {
              currentfiles.push(entry)
              currentfiles.sort(compare)
            }
          })
        })
        .catch(err => {
          if (err.name) console.warn(`Listdir ${err.name} ${err.message} for ${snap}[${path}]`)
          else throw err
        })
        .finally(() => (this.loading = false))

      if (fs.existsSync(fullpath)) { // call diffDir only if the dir exists on local disk
        this.loading = true
        diffLastDir(fullpath, snap)
          .then(entries => {
            entries.forEach(entry => {
              if (currentPath !== fullpath) return // only if it still the current path
              if (dirname(entry.path) !== fullpath || entry.path === mountpoint) {
                // ignore all parents and the mountpoint
                console.log('Discard dir', entry.path)
                return
              }
              entry.checked = true
              const index = currentfiles.findIndex(e => e.path === entry.path)
              if (index > -1) {
                const newentry = { ...currentfiles[index], ...entry }
                currentfiles.splice(index, 1, newentry)
              } else {
                currentfiles.push(entry)
                currentfiles.sort(compare)
              }
            })
          })
          .catch(err => {
            if (err.name) console.warn(`Listdir ${err.name} ${err.message} for ${snap}[${path}]`)
            else throw err
          })
          .finally(() => (this.loading = false))
      }
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
