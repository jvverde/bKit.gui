<template>
  <q-expansion-item
      switch-toggle-side
      dense
      dense-toggle
      @before-show="showChildrens"
      class="b-tree"
      :expand-icon="leaf ? 'description' : 'folder'"
      :expanded-icon="leaf ? 'description': 'folder_open'"
      expand-icon-class="b-kit-tree-icon">
      <template v-slot:header> <!-- this is the header line template -->

        <q-item-section side>
          <q-checkbox
            :indeterminate-value="null"
            toggle-indeterminate
            v-model="checked"
            keep-color
            size="xs"
            color="positive"
          />
        </q-item-section>

        <q-item-section no-wrap>
         <q-item-label @click="see">{{name}}</q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-icon name="restore" color="positive" size="xs" />
        </q-item-section>

      </template>
      <div v-if="open" style="margin-left:1em">
        <!-- dirs -->
        <tree
          :path="folder.path"
          :name="folder.name"
          :selected.sync="folder.selected"
          @update:selected="childSelect"
          @show="path => $emit('show', path)"
          v-for="folder in folders"
          :key="folder.path"/>
        <!-- files-->
        <tree
          :leaf="true"
          :path="file.path"
          :name="file.name"
          :selected.sync="file.selected"
          @update:selected="childSelect"
          @show="path => $emit('show', path)"
          v-for="file in files"
          :key="file.path"/>
      </div>

  </q-expansion-item>
</template>
<script>

import { warn } from 'src/helpers/notify'
const path = require('path')
import fs from 'fs-extra'

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
      // checked: false,
      stat: null,
      childrens: []
    }
  },
  components: {
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
    }
  },
  props: {
    path: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    leaf: {
      type: Boolean,
      default: false
    },
    selected: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    selected: function (val) {
      // console.log(`Watch selectet change to ${val} on ${this.path}`)
      if (val !== null) this.childrens.forEach(c => { c.selected = val })
    }
  },
  methods: {
    childSelect () {
      if (this.childrens.every(isChecked)) {
        this.checked = true
      } else if (this.childrens.every(isNotChecked)) {
        this.checked = false
      } else {
        this.checked = null
      }
    },
    showChildrens () {
      this.open = true
    },
    see () {
      console.log('see')
      this.$emit('show', this.path)
    },
    load (dir) {
      (async () => {
        const stat = await fs.lstat(dir)
        this.stat = stat
        this.isdir = stat.isDirectory()
        if (this.isdir) {
          const entries = await fs.readdir(dir)
          const childrens = []
          for (const entry of entries) {
            (async () => { // catch error individualy. This way it doesn't ends the loop
              const fullpath = path.join(dir, entry)
              const stat = await fs.lstat(fullpath)
              const isdir = stat.isDirectory()
              childrens.push({
                path: fullpath,
                name: entry,
                selected: this.selected,
                isdir,
                stat
              })
            })().catch(warn)
          }
          childrens.sort(compare)
          this.$nextTick(() => {
            this.childrens = childrens
          })
        }
      })().catch(warn)
    }
  },
  mounted () {
    // console.log('Load tree:', this.path)
    this.load(this.path)
  }
}
</script>

<style scoped lang="scss">

</style>

<style lang="scss">
  .b-tree .q-item__section--avatar {
    min-width:1px;
  }
  .b-kit-tree-icon {
    color: $amber;
  }
</style>
