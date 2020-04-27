<template>
  <q-expansion-item
      switch-toggle-side
      dense
      dense-toggle
      v-model="open"
      class="b-tree"
      :ref="path"
      expand-icon="keyboard_arrow_down"
      :expand-icon-class="isdir ? '' : 'noexpandicon'">
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
            :color="markcolor"
          />
        </q-item-section>

        <q-item-section no-wrap>
          <q-item-label class="ellipsis">
            <q-spinner-ios color="amber" v-if="isloading"/>
            <span :style="{ color: markcolor }">
              {{name}}
            </span>
            <q-icon color="transparent" size="xs" name="help" @click.stop="debug()"/>
          </q-item-label>
        </q-item-section>

      </template>

      <div v-show="isOpen" style="margin-left:1em">
        <!-- dirs -->
        <tree
          :entry="folder"
          :selected.sync="childChecked"
          v-for="folder in folders"
          :key="folder.path"/>
        <!-- files-->
        <tree
          :entry="file"
          :selected.sync="childChecked"
          v-for="file in files"
          :key="file.path"/>
      </div>

  </q-expansion-item>
</template>
<script>

const { basename, sep: SEP } = require('path')
const fs = require('fs')
import { readdir } from 'src/helpers/readfs'

const reducer = (a, v) => [...a, [a.pop(), v].join(SEP)]

function comparenames (a, b) {
  if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
  if (a.name.toLowerCase() > b.name.toLowerCase()) return 1
  return 0
}
function compareChildrens (a, b) {
  if (a.isdir && b.isdir) return comparenames(a, b)
  else if (!a.isdir && !b.isdir) return comparenames(a, b)
  else if (a.isdir) return -1
  else if (b.isdir) return 1
  else return 0
}

const compareReverse = (a, b) => {
  if (a.toLowerCase() < b.toLowerCase()) return 1
  if (a.toLowerCase() > b.toLowerCase()) return -1
  return 0
}

const compareAncestors = (a, b) => compareReverse(a.path, b.path)

const sepRE = new RegExp(`\\${SEP}+\$`)
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
        const elem = this.selected.find(e => e.path === this.path)
        return !elem ? false : elem.op === '-' ? null : true
      },
      set (val) {
        if (val === null && !this.isIncluded) { // Don't allow an exclude if is is not Included by an ancestor
          this.checked = false
        } else if (val === true && this.isIncluded) { // Don't need to be redundant
          this.checked = null
        } else {
          const { path, isdir } = this
          const selected = this.selected.filter(e => e.path !== path)
          if (val === null) {
            const result = [{ path, op: '-', isdir }, ...selected]
            this.$emit('update:selected', result)
          } else if (val === true) {
            const result = [{ path, op: '+', isdir }, ...selected]
            this.$emit('update:selected', result)
          } else {
            this.$emit('update:selected', selected)
          }
        }
      }
    },
    childChecked: {
      get () {
        return this.selected
      },
      set (val) {
        this.$emit('update:selected', val)
      }
    },
    ancestors () {
      const steps = this.path.split(SEP)
      steps.splice(-1) // This order is very importante. Don't change it
      const root = steps.shift()
      const ancestors = steps.reduce(reducer, [root]).filter(e => e).reverse() // [] occurs when this.path is the root (ex. C:)
      if (ancestors.length === 0 && this.path.startsWith(SEP)) ancestors.push(SEP) // just for the case \dirname or \filename 
      return ancestors
    },
    included () {
      const set = new Set(this.ancestors)
      return this.selected.filter(e => set.has(e.path)) // get marked ancestors
        .sort(compareAncestors) // sort them by the nearest one (ex: [a/b/c, a/b])
        // .map(e => e.op + e.path) // return in the form +path or -path
    },
    isIncluded () {
      return this.included[0] && this.included[0].op === '+'
      // return (this.included[0] || '').startsWith('+')
    },
    isExcluded () {
      return this.included[0] && this.included[0].op === '-'
      // return (this.included[0] || '').startsWith('-')
    },
    markcolor () {
      const isIncluded = this.checked || (this.isIncluded && this.checked !== null)
      const isExcluded = this.checked === null || this.isExcluded
      return isIncluded ? 'green' : isExcluded ? 'red' : 'initial'
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
      return (this.entry.path || '').replace(sepRE)
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
    },
    isIncluded (val) {
      if (val && this.checked === true) { // Reset a redundant mark
        this.checked = false
      } else if (!val && this.checked === null) { // Don't leave a excluded at top level
        this.checked = false
      }
    },
    isExcluded (val) {
      if (val && this.checked === null) { // Reset a redundant mark
        this.checked = false
      }
    }
  },
  methods: {
    debug (entry = this) {
      console.log(entry)
    },
    showChildrens () {
      this.open = true
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
      childrens.sort(compareChildrens)
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
      // Only if directory exists
      for await (const entry of readdir(this.path)) {
        this.updateChildrens(entry)
      }
    }
  },
  mounted () {
  }
}
</script>

<style lang="scss">
  .noexpandicon {
    visibility: hidden;
  }
</style>
