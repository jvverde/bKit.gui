<template>
  <q-expansion-item
      switch-toggle-side
      dense
      dense-toggle
      v-model="open"
      class="b-tree"
      :ref="path"
      expand-icon="keyboard_arrow_down"
      :expand-icon-class="isdir ? 'expandicon' : 'noexpandicon'">
      <template v-slot:header> <!-- this is the header line template -->

        <q-item-section side v-if="leaf">
          <q-icon name="description" color="bkiticoncolor"/>
        </q-item-section>

        <q-item-section side v-else>
          <q-icon :name="open ? 'folder_open' : 'folder'" color="bkiticoncolor"/>
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

        <q-item-section no-wrap>
          <q-item-label class="ellipsis">
            <q-spinner-ios color="amber" v-if="isloading"/>
            <span>
              {{name}}
            </span>
            <q-icon color="transparent" size="xs" name="help" @click.stop="debug(entry)"/>
          </q-item-label>
        </q-item-section>

      </template>

      <div v-show="isOpen" style="margin-left:1em">
        <!-- dirs -->
        <tree
          :entry="folder"
          :mountpoint="mountpoint"
          :selected.sync="folder.selected"
          @update:selected="childSelect"
          v-for="folder in folders"
          :key="folder.path"/>
        <!-- files-->
        <tree
          :entry="file"
          :mountpoint="mountpoint"
          :selected.sync="file.selected"
          @update:selected="childSelect"
          v-for="file in files"
          :key="file.path"/>
      </div>

  </q-expansion-item>
</template>
<script>

const { basename } = require('path')
const fs = require('fs')
import { readdir } from 'src/helpers/readfs'

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

const { chokidar, chokidarOptions } = require('src/helpers/chockidar')

export default {
  name: 'tree',
  data () {
    return {
      open: false,
      loading: 0,
      loaded: false, // the inital status is unloaded
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
    mountpoint: {
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
    isloading () {
      return this.loading
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
    }
  },
  watch: {
    selected (val) {
      // console.log(`Watch selectet change to ${val} on ${this.path}`)
      if (val !== null) this.childrens.forEach(c => { c.selected = val })
    },
    isOpen (val) {
      if (val && !this.loaded) {
        // Don't waste resources reloading. We have a chockidar mounted to watch for changes
        this.opendir()
      }
    }
  },
  methods: {
    debug (entry) {
      console.log(entry)
    },
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
      if (!this.isdir) return
      this.selectedNode = this.path
      this.$emit('show', this.path)
    },
    updateChildrens (entry) {
      entry.token = this.token
      entry.isfiltered = undefined
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
    async opendir () {
      if (!this.isdir) return
      this.childrens = []
      await this.refresh()
      this.loaded = true // Remember that is load to avoid reload again
    },
    async refresh () {
      this.loading = true
      await this.readdir()
      this.loading = false
    },
    async readdir () {
      if (!this.mountpoint || !fs.existsSync(this.path) || !this.isdir) return
      // Only if directory exists on local disk and it correspond to the backup
      for await (const entry of readdir(this.path)) {
        entry.selected = this.selected // inherit select status from parent
        this.updateChildrens(entry)
      }
    }
  },
  mounted () {
    if (this.isroot) this.showChildrens()
    if (this.isdir) {
      chokidar.watch(this.path, chokidarOptions).on('all', async (event, path) => {
        if (this.loaded) { // only care if the dir is loaded
          console.log(`On tree node ${this.path} Event ${event} for ${path}`)
          this.childrens = []
          await this.refresh()
        }
      })
    }
  }
}
</script>

<style scoped lang="scss">
  .isSelected {
    color:$primary;
  }
  .wasDeleted {
    text-decoration: line-through;
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
