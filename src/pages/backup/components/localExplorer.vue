<template>
  <div class="bkit-explorer relative-position">
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
            :currentNode.sync="currentPath"
            :selected.sync="selectedNode"
            @show="show"/>
        </q-list>
      </template>

      <template v-slot:after>
        <div class="q-pa-md row justify-evenly q-gutter-md items-stretch relative-position">
          <item
            v-for="entry in currentfiles"
            :key="entry.path"
            :entry="entry"
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
import * as bkit from 'src/helpers/bkit'
import tree from './tree'
import item from './item'
// import fs from 'fs-extra'
const path = require('path')

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

const listdir = bkit.enqueueListdir('Listdir on localexplorer')
const dkit = bkit.enqueuedkit('dKit on localexplorer')

export default {
  name: 'localexplorer',
  data () {
    return {
      verticalSplitter: 55,
      watcher: chokidar.watch(this.mountpoint, chokidarOptions),
      sep: path.sep,
      selectedNode: false,
      currentPath: '',
      loading: false,
      currentfiles: [],
      root: { isdir: true, isroot: true, path: this.mountpoint }
    }
  },
  props: {
    mountpoint: {
      type: String,
      required: true
    }
  },
  components: {
    tree,
    item
  },
  watch: {
    currentPath: async function (dir, oldir) {
      console.log(`${this.currentPath} [${oldir} => ${dir}]`)
      this.load(dir)
      await this.watcher.close()
      this.watcher.add(dir)
      this.watcher.on('all', (event, path) => {
        this.load(dir)
      })
    }
  },
  computed: {
    steps: function () {
      const relative = path.relative(this.mountpoint, this.currentPath)
      return this.currentPath !== '' ? `${relative}`.split(path.sep) : []
    },
    drive: function () {
      return this.mountpoint.replace(/[\\/]+$/, '')
    }
  },
  mounted () {
    this.show(this.mountpoint)
  },
  methods: {
    stepto (index) {
      const fullpath = path.join(this.mountpoint, this.steps.slice(0, index).join('/'))
      console.log('go to', fullpath)
      this.show(fullpath)
    },
    show (fullpath) {
      this.currentPath = fullpath
    },
    async load (fullpath) {
      console.log('Load', fullpath)
      const currentfiles = this.currentfiles = []
      this.loading = true
      for await (const entry of readdir(fullpath)) {
        // prevent the situation where dir path is no longer the current path
        if (this.currentPath === fullpath) currentfiles.push(entry)
      }
      this.loading = false
      currentfiles.sort(compare)
      this.checkdir(fullpath)
    },
    refresh (entries = this.currentfiles) {
      entries.sort(compare)
      this.currentfiles = [...entries]
    },
    refreshNextTick () {
      return this.$nextTick(() => {
        this.refresh()
      })
    },
    checkdir (fullpath) {
      if (this.currentPath !== fullpath) return // only if it still the current path
      // console.log(`Check ${fullpath} status on server`)
      const currentfiles = this.currentfiles

      const update = (entry) => {
        if (this.currentPath !== fullpath) return // only if it still the current path
        const index = currentfiles.findIndex(e => e.path === entry.path)
        if (index > -1) {
          const newentry = Object.assign(currentfiles[index], entry)
          currentfiles.splice(index, 1, newentry)
        } else {
          currentfiles.push(entry)
          currentfiles.sort(compare)
        }
      }
      const updatedir = (entry) => {
        if (path.dirname(entry.path) !== fullpath || entry.path === this.mountpoint) {
          // ignore all parents and the mountpoint
          console.log('Discard dir', entry.path)
          return
        }
        update(entry)
      }
      const discard = (name, path) => console.log(`Slow down doing ${name} for ${path}, another call is already in progress`)
      listdir(fullpath, update, () => {}, discard)
      const events = {
        newDir: updatedir,
        chgDir: updatedir,
        newFile: update,
        chgFile: update
      }
      const done = () => {
        console.log(`Done dKit for ${fullpath}`)
        if (this.currentPath === fullpath) this.loading = false
        this.refreshNextTick()
      }
      dkit(fullpath, events, done, discard)
      this.loading = true
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
