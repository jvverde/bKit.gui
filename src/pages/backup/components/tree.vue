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
        <tree
          :path="folder.path"
          :name="folder.name"
          :selected.sync="folder.selected"
          @update:selected="childSelect"
          v-for="folder in folders"
          :key="folder.path"/>
        <tree
          :leaf="true"
          :path="file.path"
          :name="file.name"
          :selected.sync="file.selected"
          @update:selected="childSelect"
          v-for="file in files"
          :key="file.path"/>
      </div>
  </q-expansion-item>
</template>
<script>

import { warn } from 'src/helpers/notify'
import * as bkit from 'src/helpers/bkit'
const path = require('path')
import fs from 'fs-extra'

// <f+++++++++|2020/02/22-16:05:08|99|/home/jvv/projectos/bkit/apps/webapp.oldversion/.eslintignore
const regexpNewFile = /^<f[+]{9}[|]([^|]*)[|]([^|]*)[|]([^|]*)/
const regexpNewDir = /^cd[+]{9}[|]([^|]*)[|]([^|]*)[|]([^|]*)/
// <f.st......|2020/02/23-18:24:04|1652|/home/jvv/projectos/bkit/apps/client/package.json
const regexpChgFile = /^<f.s.{7}[|]([^|]*)[|]([^|]*)[|]([^|]*)/

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
    },
    checkdir () {
      console.log('Check dir:', this.path)
      const entries = []
      bkit.bash('./dkit.sh', [
        '--no-recursive',
        '--dirs',
        `${this.path}/`
      ], {
        onclose: () => {
          this.$nextTick(() => {
            console.log('dkit done')
            entries.sort(compare)
            // this.currentnodeentries = node.entries = entries
            // if (this.selected === node.path) this.currentfiles = [...node.children]
          })
        },
        onreadline: (line) => {
          console.log('dkit:', line)
          const newfileMatch = line.match(regexpNewFile)
          if (newfileMatch) { // if this file is will be new on backup
            // const stepaths = (newfileMatch[3] || '').split('/')
            // const [name] = stepaths.slice(-1)
            // console.log(`File ${name} doesn't exits in backup yet`)
            // entries.push({ name, isfile: true, type: 'new' })
            // const node = this.tree.getNodeByKey(newfileMatch[3])
            // node.missing = true
          } else {
            const chgFileMatch = line.match(regexpChgFile)
            if (chgFileMatch) {
              // const stepaths = (chgFileMatch[3] || '').split('/')
              // const [name] = stepaths.slice(-1)
              // console.log(`File ${name} need update on backup yet`)
              // entries.push({ name, isfile: true, type: 'modified' })
              // const node = this.tree.getNodeByKey(chgFileMatch[3])
              // node.missing = false
              // node.needupdate = true
            } else {
              const newdirMatch = line.match(regexpNewDir)
              if (newdirMatch) {
                // const stepaths = (newdirMatch[3] || '').split('/')
                // const [name] = stepaths.slice(-1)
                // console.log(`Dir ${name} doesn't exits in backup yet`)
                // entries.push({ name, isdir: true, type: 'new' })
                // const node = this.tree.getNodeByKey(newdirMatch[3])
                // node.missing = true
              }
            }
          }
        }
      })
    },
    load (dir) {
      (async (self) => {
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
                selected: self.selected,
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
      })(this).catch(warn)
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
