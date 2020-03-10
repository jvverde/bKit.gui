<template>
  <q-expansion-item
      switch-toggle-side
      dense
      dense-toggle
      @before-show="open = true"
      @hide="open = false"
      class="b-tree"
      :ref="path"
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
            color="bkiticoncolor"
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
import * as bkit from 'src/helpers/bkit'
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
      return this.entry.status === 'onbackup'
    }
  },
  watch: {
    selected: function (val) {
      // console.log(`Watch selectet change to ${val} on ${this.path}`)
      if (val !== null) this.childrens.forEach(c => { c.selected = val })
    },
    currentNode: function (fullpath) {
      // console.log(`Watch currentNode change to ${fullpath} on ${this.path}`)
      if (!this.leaf && fullpath.includes(this.path)) {
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
      this.$refs[this.path].show() // call show method on three
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
    shouldIcheck () {
      return this.isroot || (this.isdir && this.entry.status === 'onbackup')
    },
    updateInNextTick (childrens) {
      return this.$nextTick(() => {
        this.childrens = childrens
      })
    },
    checkBackup () {
      const childrens = this.childrens
      if (this.isroot || (this.isdir && this.entry.status === 'onbackup')) {
        const entry = (file) => {
          const index = childrens.findIndex(e => e.path === file.path)
          if (index >= 0) {
            const children = Object.assign({}, childrens[index], file)
            childrens.splice(index, 1, children)
          } else this.deletedChildrens++
        }
        const atend = async () => { this.loading = false }
        this.loading = true
        bkit.listdirs(this.path, { entry, atend })
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
    color: $bkit-color;
  }
  .noexpandicon {
    visibility: hidden;
  }

</style>
