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
            <q-icon name="done" v-if="onbackup"/>
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
          :currentNode.sync="selectedNode"
          :selected.sync="folder.selected"
          @update:selected="childSelect"
          @show="path => $emit('show', path)"
          v-for="folder in folders"
          :key="folder.path"/>
        <!-- files-->
        <tree
          :entry="file"
          :currentNode.sync="selectedNode"
          :selected.sync="file.selected"
          @update:selected="childSelect"
          @show="path => $emit('show', path)"
          v-for="file in files"
          :key="file.path"/>
      </div>

  </q-expansion-item>
</template>
<script>

import { readdir } from 'src/helpers/readfs'
const path = require('path')

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

import * as bkit from 'src/helpers/bkit'
const listdir = bkit.enqueueListdir('Listdir on tree')

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
    currentNode: {
      type: String,
      required: true
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
      return this.path === this.currentNode
    },
    selectedNode: {
      get () {
        return this.currentNode
      },
      set (val) {
        this.$emit('update:currentNode', val)
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
      return !!this.entry.onbackup
    }
  },
  watch: {
    selected: function (val) {
      // console.log(`Watch selectet change to ${val} on ${this.path}`)
      if (val !== null) this.childrens.forEach(c => { c.selected = val })
    },
    currentNode: function (fullpath) {
      if (!this.leaf && fullpath.includes(this.path)) {
        // console.log(`Watch currentNode change to ${fullpath} on ${this.path}`)
        this.showChildrens()
      }
    },
    isOpen: function (val) {
      // console.log(`isOpen change to ${val} on ${this.path}`)
      if (val && !this.loaded) this.load()
    },
    onbackup: function (val) {
      if (val && this.isOpen) this.checkBackup()
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
    updateInNextTick (childrens) {
      return this.$nextTick(() => {
        this.childrens = childrens
      })
    },
    checkBackup () {
      const childrens = this.childrens
      if (this.isroot || (this.isdir && this.onbackup)) {
        // Only if it is root or otherwise the parent (this) is on backup and is a directory
        const event = (entry) => {
          const index = childrens.findIndex(e => e.path === entry.path)
          if (index >= 0) {
            const children = Object.assign({}, childrens[index], entry)
            childrens.splice(index, 1, children)
          } else this.deletedChildrens++
        }
        const done = () => { this.loading = false }
        this.loading = true
        listdir([this.path], event, done)
      }
    },
    async load () {
      const childrens = []
      this.loading = true
      for await (const entry of readdir(this.path)) {
        entry.selected = this.selected
        childrens.push(entry)
      }
      childrens.sort(compare)
      this.loading = false
      await this.updateInNextTick(childrens)
      this.checkBackup(childrens)
      this.loaded = true
    }
  },
  mounted () {
    if (this.isroot) this.showChildrens()
    if (this.isdir) {
      chokidar.watch(this.path, chokidarOptions).on('all', (event, path) => {
        // console.log(`[${this.path}]Event ${event} for ${path}`)
        this.load()
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
