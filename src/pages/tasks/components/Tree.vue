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
            <q-icon color="black" size="xs" name="help" @click.stop="debug(entry)"/>
          </q-item-label>
        </q-item-section>

      </template>

      <div v-show="isOpen" style="margin-left:1em">
        <!-- dirs -->
        <tree
          :entry="folder"
          :selected.sync="selected"
          @update:selected="select"
          v-for="folder in folders"
          :key="folder.path"/>
        <!-- files-->
        <tree
          :entry="file"
          :selected.sync="selected"
          @update:selected="select"
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

// const isChecked = node => node.selected
// const isNotChecked = node => node.selected === false

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
      type: Array,
      default: () => []
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
        if (this.selected.find(e => (e.path === this.path && e.op === '+'))) {
          return true
        } else if (this.selected.find(e => (e.path === this.path && e.op === '-'))) {
          return null
        }
        console.log('Get false for path', this.path, this.selected)
        return false
      },
      set (val) {
        const others = this.selected.filter(e => e.path !== this.path)
        if (val === null) {
          const result = [{ path: this.path, op: '-' }, ...others]
          console.log('On null Emit', result, 'on path', this.path)
          this.$emit('update:selected', result)
        } else if (val) {
          const result = [{ path: this.path, op: '+' }, ...others]
          console.log('On true Emit', result, 'on path', this.path)
          this.$emit('update:selected', result)
        } else {
          console.log('on false Emit', others, 'on path', this.path)
          this.$emit('update:selected', others)
        }
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
    select (val) {
      this.$emit('update:selected', val)
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
      if (!fs.existsSync(this.path) || !this.isdir) return
      // Only if directory exists on local disk and it correspond to the backup
      for await (const entry of readdir(this.path)) {
        entry.selected = this.selected // inherit select status from parent
        this.updateChildrens(entry)
      }
    }
  },
  mounted () {
    // if (this.isroot) this.showChildrens()
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
