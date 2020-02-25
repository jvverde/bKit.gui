<template>
  <q-expansion-item
      switch-toggle-side
      dense
      dense-toggle
      @before-show="showChildrens"
      class="b-tree"
      :expand-icon="leaf ? 'description' : 'folder'"
      :expanded-icon="leaf ? 'description': 'folder_open'"
      expand-icon-class="b-kit-tree-icon"
      :label="name">
      <template v-slot:header>

          <q-item-section side>
            <q-checkbox
              :indeterminate-value="null"
              toggle-indeterminate
              v-model="checked"
              keep-color
              size="xs"
              color="positive"
              @click.native.stop="usertoogle"/>
          </q-item-section>

          <!--q-item-section side>
            <q-icon name="folder" color="amber" size="xs"/>
          </q-item-section-->

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
          @toogle="childToggled"
          v-for="folder in folders"
          :key="folder.path"/>
        <tree
          :leaf="true"
          :path="file.path"
          :name="file.name"
          @toogle="childToggled"
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

const isChecked = node => node.checked === true
const isNotChecked = node => node.checked === false

/*
function recursiveChecked (node, level = 0) {
  if (level > 100) {
    throw new Error('Recursion too deep (> 100)')
  }
  (node.children || []).map(child => {
    child.checked = node.checked
    recursiveChecked(child, level + 1)
  })
}

function upsideInform (parent) {
  if (parent === null) {
    return
  } else if (parent.children.every(isChecked)) {
    parent.checked = true
  } else if (parent.children.every(isNotChecked)) {
    parent.checked = false
  } else {
    parent.checked = null
  }
  return upsideInform(parent.parent)
}
*/
export default {
  name: 'tree',
  data () {
    return {
      open: false,
      checked: false,
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
    }
  },
  methods: {
    usertoogle () {
      console.log('User toogle to:', this.checked)
      if (this.checked !== null) {
        this.toogleUp(this.checked)
      }
    },
    toogleUp (value) {
      const path = this.path
      this.$emit('toogle', { path, value })
    },
    toggle (value) {
      this.checked = value
      console.log(`Set ${this.path} to check = ${this.checked}`)
      this.toogleUp(value)
    },
    childToggled ({ path, value }) {
      console.log(`Child ${path} toggle to:`, value)
      const child = this.childrens.find(e => e.path === path)
      if (child) {
        console.log('Child:', child)
        child.checked = value
        this.childrens.map(c => {
          console.log('checked:', c.checked)
        })
        if (this.childrens.every(isChecked)) {
          this.toggle(true)
        } else if (this.childrens.every(isNotChecked)) {
          this.toggle(false)
        } else {
          this.toggle(null)
        }
      }
    },
    showChildrens () {
      this.open = true
    },
    see () {
      console.log('see')
    },
    selectdir (key) {
      if (!key) return
      this.selected = key
      const node = this.tree.getNodeByKey(key)
      if (node.children) this.currentfiles = [...node.children]
      this.tree.setExpanded(key, true)
    },
    select (dir) {
      console.log('select dir', dir)
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
    console.log('Load tree:', this.path)
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
