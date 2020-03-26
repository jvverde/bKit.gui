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

        <q-item-section side v-if="isloading">
          <q-spinner-ios color="amber"/>
        </q-item-section>

        <q-item-section side no-wrap>
           <q-btn-group flat rounded>
            <q-btn round color="positive" flat size="sm" icon="restore"/>
          </q-btn-group>
        </q-item-section>

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

const { relative, join, basename, posix, dirname } = require('path')
const slash = require('slash')
const fs = require('fs')
import { readdir } from 'src/helpers/readfs'
import { diffList4Snap, listDir4Snap } from 'src/helpers/bkit'

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

export default {
  name: 'tree',
  data () {
    return {
      open: false,
      loading: 0,
      stat: null,
      deletedChildrens: 0,
      loaded: false, // the inital stat is unloaded
      invalidateCache: true,
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
    isloading () {
      return this.loading !== 0
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
      return this.isroot ? this.path : basename(this.path)
    },
    leaf () {
      return !this.isdir
    },
    isOpen () {
      return this.open && this.isdir
    },
    onbackup () { // We should be very carefully with this one
      return !!this.entry.onbackup // && !!this.entry.markAsUnverified
    },
    onlocal () {
      return !!this.entry.onlocal
    },
    wasdeleted () { return this.onbackup && !this.onlocal },
    isfiltered () { return !this.onbackup && this.onlocal && !this.entry.isnew },
    isnew () { return !this.onbackup && this.onlocal && !!this.entry.isnew },
    wasmodified () { return this.onbackup && this.onlocal && !!this.entry.wasmodified },
    isUpdate () { return this.onbackup && this.onlocal && !this.isnew && !this.wasmodified },
    token () {
      const r = Math.random().toString(36).substring(2)
      return [this.path, this.snap, this.rvid, r].join('')
    }
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
      if (val && !this.loaded) {
        // Don't waste resources reloading. We have a chockidar mounted to watch for changes
        this.opendir()
      }
    },
    snap: async function () {
      // this is obvious. If snap change it needs to check/compare with backup
      if (this.loaded) {
        this.checkDirOnBackup()
      }
    },
    onbackup: async function (val) {
      // If parent (=this) changed status it should check with backup
      if (this.loaded) {
        this.checkDirOnBackup()
      }
    },
    isnew: async function (val) {
      // If parent changed status it should check with backup
      if (this.loaded) {
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
    async diffDir () {
      const { invalidateCache, snap, rvid, path, isdir, mountpoint, updateChildrens } = this
      if (!rvid || !isdir) return
      // Tt doesn't make any sense unless it is a dir and a remote volume ID (rvid) exists
      if (!mountpoint || !fs.existsSync(path)) return
      // As well it only make sense if dir exists localy on the corresponding disk
      // console.log('diffDir', path)

      this.loading++

      diffList4Snap(path, snap, { invalidateCache })
        .then(entries => {
          entries.forEach(entry => {
            if (dirname(entry.path) !== path || entry.path === mountpoint) {
              // console.log(`Discard self-or-ancestor ${entry.path} of ${path}`)
            } else {
              updateChildrens(entry)
            }
          })
          this.invalidateCache = false
        })
        .catch(err => {
          if (err.name && err.name === 'Replaced') {
            console.log(`diffList4Snap [${err.name}] ${err.message} for ${snap}[${path}]`)
          } else {
            console.error('Catch in diffList4Snap', err.name, err.message, err)
          }
        })
        .finally(() => this.loading--)
    },
    async readDirOnBackup () {
      const { snap, rvid, path, isdir, mountpoint, updateChildrens, onbackup } = this
      if (!isdir || !onbackup) return
      // Only read backups dir if it is a directory and itself is on backup

      // console.log('readDirOnBackup', path)
      this.loading++

      let mountRelative = mountpoint ? relative(mountpoint, path) : path
      mountRelative = slash(posix.normalize(`/${mountRelative}/`))
      mountRelative = posix.normalize(mountRelative)

      listDir4Snap(mountRelative, snap, rvid)
        .then(entries => {
          entries.forEach(entry => {
            entry.path = join(path, entry.name)
            updateChildrens(entry)
          })
        })
        .catch(err => {
          if (err.name && err.name === 'Replaced') {
            console.log(`listDir4Snap [${err.name}] ${err.message} for ${snap}[${path}]`)
          } else {
            console.error('Catch in listDir4Snap', err.name, err.message, err)
          }
        })
        .finally(() => this.loading--)
    },
    updateChildrens (entry) {
      entry.verified = this.token
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
    markAsUnverified () {
      this.childrens.forEach(c => {
        c.wasmodified = c.isnew = c.wasdeleted = c.onbackup = undefined
        if (!c.onlocal) c.verified = false
      })
    },
    rmUnverifield () {
      let i = this.childrens.length
      while (i--) {
        if (this.childrens[i].onlocal) continue // local files should never be removed
        if (this.childrens[i].verified !== this.token) {
          this.childrens.splice(i, 1) // remove it from list
        }
      }
    },
    async checkDirOnBackup () {
      if (!this.isdir) return
      // console.log('checkDirOnBackup', this.path)
      this.markAsUnverified()
      await this.diffDir() // This only give diferences between local and remote. It doesn't include deleted
      await this.readDirOnBackup() // This give us all files on remote dir. The diference will be the deleted ones
      this.rmUnverifield()
    },
    async readdir () {
      if (!this.mountpoint || !fs.existsSync(this.path) || !this.isdir) return
      // Only if directory exists on local disk and it correspond to the backup
      this.loading = true
      for await (const entry of readdir(this.path)) {
        entry.selected = this.selected // inherit select status from parent
        this.updateChildrens(entry)
      }
      this.loading = false
    },
    async opendir () {
      if (!this.isdir) return
      this.childrens = []
      await this.readdir()
      await this.checkDirOnBackup()
      this.loaded = true // Remember that is load and allow avoid reload again
    },
    async refresh () {
      await this.readdir()
      await this.checkDirOnBackup()
    }
  },
  mounted () {
    if (this.isroot) this.showChildrens()
    if (this.isdir) {
      chokidar.watch(this.path, chokidarOptions).on('all', async (event, path) => {
        console.log(`[${this.path}]Event ${event} for ${path}`)
        this.invalidateCache = true // Don't use the cache is local files has been changed
        await this.refresh()
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
