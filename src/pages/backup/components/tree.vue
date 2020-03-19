<template>
  <q-expansion-item
      switch-toggle-side
      dense
      dense-toggle
      v-model="open"
      class="b-tree"
      :ref="path"
      :header-style="isSelected ? 'background-color:#eef' : ''"
      expand-icon="keyboard_arrow_down"
      :expand-icon-class="isdir ? 'expandicon' : 'noexpandicon'">
      <template v-slot:header> <!-- this is the header line template -->

        <q-item-section side>
          <q-icon :name="leaf ? 'description' : open ? 'folder_open' : 'folder'" color="bkiticoncolor"/>
        </q-item-section>

        <q-item-section side>
          <q-checkbox
            :indeterminate-value="null"
            toggle-indeterminate
            v-model="checked"
            keep-color
            size="xs"
            color="bkitchekcolor"
          />
        </q-item-section>

        <q-item-section no-wrap :class="{ isSelected: isSelected }" @click.stop="see">
          <q-item-label>
            {{name}}
            <q-icon name="done_all" color="green" v-if="isUpdate"/>
            <q-icon name="call_merge" color="cyan" v-else-if="wasmodified" class="flip-vertical"/>
            <q-icon name="arrow_downward" color="orange" v-else-if="isnew"/>
            <q-icon name="arrow_upward" color="red" v-else-if="wasdeleted"/>
          </q-item-label>
        </q-item-section>

        <q-item-section side no-wrap>
           <q-btn-group flat rounded>
            <q-btn round color="positive" flat size="sm" icon="restore"/>
          </q-btn-group>
        </q-item-section>

        <q-inner-loading :showing="loading">
          <q-spinner-ios color="amber"/>
        </q-inner-loading>

      </template>

      <div v-show="isOpen" style="margin-left:1em">
        <!-- dirs -->
        <tree
          :entry="folder"
          :mountpoint="mountpoint"
          :rvid="rvid"
          :snap="snap"
          :displayNode.sync="selectedNode"
          :selected.sync="folder.selected"
          @update:selected="childSelect"
          @show="path => $emit('show', path)"
          v-for="folder in folders"
          :key="folder.path"/>
        <!-- files-->
        <tree
          :entry="file"
          :mountpoint="mountpoint"
          :rvid="rvid"
          :snap="snap"
          :displayNode.sync="selectedNode"
          :selected.sync="file.selected"
          @update:selected="childSelect"
          @show="path => $emit('show', path)"
          v-for="file in files"
          :key="file.path"/>
      </div>

  </q-expansion-item>
</template>
<script>

const path = require('path')
const slash = require('slash')
const fs = require('fs')
import { readdir } from 'src/helpers/readfs'
import * as bkit from 'src/helpers/bkit'

function comparenames (a, b) {
  if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
  if (a.name.toLowerCase() > b.name.toLowerCase()) return 1
  return 0
}
function compare (a, b) {
  if (a.isdir && b.isdir) return comparenames(a, b)
  else if (!a.isdir && !b.isdir) return comparenames(a, b)
  else if (a.isdir) return -1
  else if (b.isdir) return 1
  else return 0
}

const isChecked = node => node.selected === true
const isNotChecked = node => node.selected === false

const chokidar = require('chokidar')
const chokidarOptions = {
  depth: 0,
  ignoreInitial: true,
  atomic: true,
  ignorePermissionErrors: true,
  persistent: true
}

const listdir = bkit.enqueueListdir('tree->Listdir') // enqueued request but discard duplicate paths
const dkit = bkit.enqueuedkit('tree->dKit') // enqueued request but discard duplicate paths
function listdirAsync (path, args, event) {
  return new Promise((resolve, reject) => {
    listdir(path, args, event, resolve)
  })
}
function dkitAsync (path, args, events) {
  return new Promise((resolve, reject) => {
    dkit(path, args, events, resolve)
  })
}

export default {
  name: 'tree',
  data () {
    return {
      open: false,
      loading: false,
      stat: null,
      deletedChildrens: 0,
      loaded: false,
      childrens: []
    }
  },
  props: {
    entry: {
      type: Object,
      required: true
    },
    selected: {
      type: Boolean,
      default: false
    },
    displayNode: { // path of current displayed node
      type: String,
      required: true
    },
    mountpoint: {
      type: String,
      required: true
    },
    rvid: {
      type: String,
      default: undefined
    },
    snap: {
      type: String,
      default: ''
    }
  },
  computed: {
    folders () {
      return this.childrens.filter(e => e.isdir)
    },
    files () {
      return this.childrens.filter(e => !e.isdir)
    },
    checked: {
      get () {
        return this.selected
      },
      set (val) {
        this.$emit('update:selected', val)
      }
    },
    isSelected () {
      return this.path === this.displayNode
    },
    selectedNode: {
      get () {
        return this.displayNode
      },
      set (val) {
        this.$emit('update:displayNode', val)
      }
    },
    isdir () {
      return this.entry.isdir
    },
    isroot () {
      return this.entry.isroot
    },
    path () {
      return this.entry.path
    },
    name () {
      return this.isroot ? this.path : path.basename(this.path)
    },
    leaf () {
      return !this.isdir
    },
    isOpen () {
      return this.open && this.isdir
    },
    onbackup () { // We should be very carefully with this one
      return !!this.entry.onbackup // && !!this.entry.verifiedChildrens
    },
    onlocal () {
      return !!this.entry.onlocal
    },
    wasdeleted () { return this.onbackup && !this.onlocal },
    isfiltered () { return !this.onbackup && this.onlocal && !this.entry.isnew },
    isnew () { return !this.onbackup && this.onlocal && !!this.entry.isnew },
    wasmodified () { return this.onbackup && this.onlocal && !!this.entry.wasmodified },
    isUpdate () { return this.onbackup && this.onlocal && !this.isnew && !this.wasmodified }
  },
  watch: {
    selected: function (val) {
      // console.log(`Watch selectet change to ${val} on ${this.path}`)
      if (val !== null) this.childrens.forEach(c => { c.selected = val })
    },
    displayNode: function (fullpath) {
      if (!this.leaf && fullpath.includes(this.path)) {
        // console.log(`Watch displayNode change to ${fullpath} on ${this.path}`)
        this.showChildrens()
      }
    },
    isOpen: function (val) {
      if (val && !this.loaded) this.loaddir()
    },
    onbackup: async function (val) {
      if (this.loaded) {
        if (val) {
          this.checkDirOnBackup()
        } else {
          this.verifiedChildrens(false)
        }
      }
    },
    snap: async function () {
      if (this.loaded && this.isroot) {
        this.checkDirOnBackup()
      }
    },
    isnew: async function (val) {
      if (val && this.isdir && this.loaded) {
        this.checkDirOnBackup()
      }
    }
  },
  methods: {
    showChildrens () {
      this.open = true
    },
    childSelect () {
      if (this.childrens.every(isChecked)) {
        this.checked = true
      } else if (this.childrens.every(isNotChecked)) {
        this.checked = false
      } else {
        this.checked = null
      }
    },
    see () {
      this.selectedNode = this.path
      this.$emit('show', this.path)
    },
    updateChildrens (entry) {
      const childrens = this.childrens
      const index = childrens.findIndex(e => e.path === entry.path)
      if (index >= 0) {
        const children = { ...childrens[index], ...entry }
        childrens.splice(index, 1, children)
      } else {
        childrens.push(entry)
      }
      childrens.sort(compare)
    },
    async cmpdir () {
      if (!this.rvid || !this.isdir) return
      // it doesn't make any sense unless it is a dir and a remote volume ID (rvid) exists
      if (!this.mountpoint || !fs.existsSync(this.path)) return
      // As well it only make sense if file exists localy and on the corresponding disk
      console.log('cmpdir', this.path)
      const event = (entry) => {
        if (path.dirname(entry.path) !== this.path || entry.path === this.mountpoint) {
          // ignore all parents and the mountpoint
          console.log(`Discard entry ${entry.path} on ${this.path}`)
          return
        }
        this.updateChildrens(entry)
      }
      this.loading = true
      const events = { newDir: event, chgDir: event, newFile: event, chgFile: event }
      const args = []
      if (this.snap) args.push(`--snap=${this.snap}`)
      return dkitAsync(this.path, args, events)
        .then(code => console.log('dkit done with code', code))
        .catch(error => console.error('Error:', error))
        .finally(() => { this.loading = false })
    },
    async readbackup () {
      if (!this.isdir || !this.onbackup) return
      // Only does this if it is a directory and itself is on backup
      console.log('readbackup', this.path)
      this.loading = true
      const event = (entry) => {
        entry.path = path.join(this.mountpoint, entry.path)
        this.updateChildrens(entry)
      }
      let relative = this.mountpoint ? path.relative(this.mountpoint, this.path) : this.path
      relative = slash(path.posix.normalize(`/${relative}/`))
      relative = path.posix.normalize(relative)
      const args = [ `--rvid=${this.rvid}` ]
      if (this.snap) args.push(`--snap=${this.snap}`)
      return listdirAsync(relative, args, event)
        .then(code => console.log('listdir done with code ', code))
        .catch(error => console.error('Error:', error))
        .finally(() => { this.loading = false })
    },
    async readdir () {
      if (!this.mountpoint || !fs.existsSync(this.path)) return
      // Only if directory exists on local disk and it correspond to the backup
      this.loading = true
      for await (const entry of readdir(this.path)) {
        entry.selected = this.selected // inherit select status from parent
        this.updateChildrens(entry)
      }
      this.loading = false
    },
    verifiedChildrens (val = true) {
      this.childrens.forEach(c => { c.onbackup = val })
    },
    cleanupChildrens () {
      this.childrens
        .map((e, i) => (e.onbackup || e.onlocal) ? false : i) // mark childrens not in local or in backup
        .filter(e => e !== false) // remove unmarked chidrens
        .reverse() // This is very importante!!! WE need to start from the last position
        .forEach(index => this.childrens.splice(index, 1)) // remove marked(=not existing) childrens
    },
    async checkDirOnBackup () {
      if (!this.isdir) return
      // Doesn't make sense for files
      console.log('checkDirOnBackup', this.path)
      this.verifiedChildrens(false)
      await this.readbackup()
      await this.cmpdir()
      this.cleanupChildrens()
    },
    async loaddir () {
      this.childrens = []
      await this.readdir()
      await this.checkDirOnBackup()
      this.loaded = true
    }
  },
  mounted () {
    if (this.isroot) this.showChildrens()
    if (this.isdir) {
      chokidar.watch(this.path, chokidarOptions).on('all', (event, path) => {
        console.log(`[${this.path}]Event ${event} for ${path}`)
        this.loaddir()
      })
    }
  }
}
</script>

<style scoped lang="scss">
  .isSelected {
    color:$primary;
  }
</style>

<style lang="scss">
  @import 'src/css/app.scss';

  .expandicon, .noexpandicon {
    margin: 0px;
    padding: 0px;
    padding-right: 5px;
    color: $bkit-check-color;
  }
  .noexpandicon {
    visibility: hidden;
  }

</style>
