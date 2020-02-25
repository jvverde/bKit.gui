<template>
  <q-expansion-item
      switch-toggle-side
      dense
      dense-toggle
      @before-show="show"
      class="b-tree"
      :label="name">
      <template v-slot:header>
          <q-item-section thumbnail>
            <q-icon name="folder" color="amber" size="xs"/>
          </q-item-section>

          <q-item-section no-wrap>
           <q-item-label @click="see">{{name}}</q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-icon name="restore" color="primary" size="24px" />
          </q-item-section>
      </template>
      <div v-if="open" style="margin-left:1em">
        <tree
          :path="folder.path"
          :name="folder.name"
          v-for="folder in folders"
          :key="folder.path"/>
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

const isChecked = node => node.checked === true
const isNotChecked = node => node.checked === false

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
      childrens: []
    }
  },
  computed: {
    folders () {
      return this.childrens.filter(e => e.isdir)
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
    }
  },
  methods: {
    show () {
      console.log('show', this.path)
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
    node_checked (node) {
      if (node.checked !== null) {
        // recursiveChecked(node)
        // upsideInform(node.parent)
      }
    },
    async load (dir) {
      try {
        const entries = await fs.readdir(dir)
        const childrens = []
        for (const entry of entries) {
          try {
            const fullpath = path.join(dir, entry)
            const stat = await fs.stat(fullpath)
            const isDirectory = stat.isDirectory()
            childrens.push({
              // parent: node,
              isdir: isDirectory,
              path: fullpath,
              name: entry,
              icon: isDirectory ? 'folder' : 'description',
              lazy: isDirectory,
              expandable: isDirectory,
              open: false,
              // checked: !!node.checked,
              stat: stat
            })
          } catch (err) {
            warn(err)
          }
        }
        childrens.sort(compare)
        this.$nextTick(() => {
          this.childrens = childrens
          // console.log(`Childrens of ${this.path} are now`, this.childrens)
        })
        // this.checkdir()
      } catch (err) {
        warn(err)
        // fail(err)
      }
    }
  },
  mounted () {
    console.log('Mount tree:', this.path)
    this.load(this.path)
  }
}
</script>

<style scoped lang="scss">
  .hover:hover{
    background-color: $grey-2;
  }
  .q-item__section--avatar {
    min-width:100px;
  }
</style>

<style lang="scss">
  .b-tree .q-item__section--avatar {
    min-width:1px;
  }
</style>
