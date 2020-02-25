<template>
  <div class="bkit-explorer">
    <q-splitter
      class="bkit-splitter"
      :limits="[0, 80]"
      v-model="splitterModel">

      <template v-slot:before>
        <q-list class="rounded-borders">
          <tree
            :path="mountpoint"
            :name="mountpoint"
            :selected.sync="selected"
            @show="show"/>
        </q-list>
      </template>

      <template v-slot:after>
        <div class="q-pa-md row justify-around q-gutter-md items-stretch">
          <q-card v-for="entry in currentfiles" :key="entry.path" class="column">
            <div class="column no-wrap items-center">
              <q-icon v-if="entry.isdir" name="folder" style="font-size:8em"
                color="amber"/>
              <q-icon v-else name="description" style="font-size:8em"
                color="amber"/>
              <div style="max-width:8em;overflow-wrap: break-word; text-align:center">{{entry.name}}</div>
              <div v-if="entry.type === 'new'">missing</div>
              <div v-if="entry.type === 'modified'">modified</div>
            </div>
            <q-card-actions align="right" style="margin-top:auto">
              <q-btn flat round color="red" icon="favorite" />
              <q-btn flat round color="teal" icon="bookmark" />
              <q-btn flat round color="primary" icon="share" />
            </q-card-actions>
          </q-card>
        </div>
      </template>
    </q-splitter>
  </div>
</template>
<script>

import { warn } from 'src/helpers/notify'
import * as bkit from 'src/helpers/bkit'
import tree from './tree'
import fs from 'fs-extra'
const path = require('path')

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
  else if (a.isfile && b.isfile) return comparenames(a, b)
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
  name: 'localexplorer',
  data () {
    return {
      splitterModel: 55,
      selected: false,
      root: [],
      children: [],
      currentfiles: []
    }
  },
  props: {
    mountpoint: {
      type: String,
      required: true
    }
  },
  components: {
    tree
  },
  methods: {
    show (fullname) {
      console.log('fullname:', fullname)
      this.checkdir(fullname)
    },
    changeView (entries) {
      this.currentfiles = []
      entries.sort(compare)
      this.$nextTick(() => {
        this.currentfiles = entries
      })
    },
    checkdir (fullname) {
      console.log('Check entry:', fullname)
      const entries = []
      bkit.bash('./dkit.sh', [
        '--no-recursive',
        '--dirs',
        `${fullname}`
      ], {
        onclose: async () => {
          (async () => {
            const stat = await fs.lstat(fullname)
            if (stat.isDirectory()) {
              const localfiles = await fs.readdir(fullname)
              for (const file of localfiles) {
                (async () => { // catch error individualy. This way it doesn't ends the loop
                  const filename = path.join(fullname, file)
                  if (!entries.find(e => e.path === filename)) {
                    const stat = await fs.lstat(filename)
                    const isdir = stat.isDirectory()
                    entries.push({
                      path: filename,
                      name: file,
                      isdir,
                      isfile: !isdir,
                      type: 'updated',
                      stat
                    })
                  }
                })().catch(warn)
              }
              this.changeView(entries) // force rendering again
            }
          })().catch(warn)
          console.log('dkit done')
          this.changeView(entries)
        },
        onreadline: (line) => {
          console.log('Read from dkit:', line)
          const newfileMatch = line.match(regexpNewFile)
          if (newfileMatch) { // if this file is will be new on backup
            const filename = newfileMatch[3] || ''
            const stepaths = filename.split('/')
            const [name] = stepaths.slice(-1)
            console.log(`File ${name} doesn't exits in backup yet`)
            entries.push({ name, isfile: true, type: 'new', path: filename })
          } else {
            const chgFileMatch = line.match(regexpChgFile)
            if (chgFileMatch) {
              const filename = chgFileMatch[3] || ''
              const stepaths = filename.split('/')
              const [name] = stepaths.slice(-1)
              console.log(`File ${name} need update on backup yet`)
              entries.push({ name, isfile: true, type: 'modified', path: filename })
            } else {
              const newdirMatch = line.match(regexpNewDir)
              if (newdirMatch) {
                const dirname = newdirMatch[3] || ''
                const stepaths = dirname.split('/')
                const [name] = stepaths.slice(-1)
                console.log(`Dir ${name} doesn't exits in backup yet`)
                entries.push({ name, isdir: true, type: 'new', path: dirname })
              }
            }
          }
        }
      })
    }
  }
  /*
  computed: {
    folders () {
      return this.childrens.filter(e => e.isdir)
    }
  },
  props: {
    path: {
      type: String,
      required: true
    }
  },
  methods: {
    selectdir (key) {
      if (!key) return
      this.selected = key
      const node = this.tree.getNodeByKey(key)
      if (node.children) this.currentfiles = [...node.children]
      this.tree.setExpanded(key, true)
    },
    checkdir (node) {
      console.log('Check dir:', node.path)
      const entries = []
      bkit.bash('./dkit.sh', [
        '--no-recursive',
        '--dirs',
        `${node.path}/`
      ], {
        onclose: () => {
          this.$nextTick(() => {
            console.log('dkit done')
            entries.sort(compare)
            // this.currentnodeentries = node.entries = entries
            if (this.selected === node.path) this.currentfiles = [...node.children]
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
            const node = this.tree.getNodeByKey(newfileMatch[3])
            node.missing = true
          } else {
            const chgFileMatch = line.match(regexpChgFile)
            if (chgFileMatch) {
              // const stepaths = (chgFileMatch[3] || '').split('/')
              // const [name] = stepaths.slice(-1)
              // console.log(`File ${name} need update on backup yet`)
              // entries.push({ name, isfile: true, type: 'modified' })
              const node = this.tree.getNodeByKey(chgFileMatch[3])
              node.missing = false
              node.needupdate = true
            } else {
              const newdirMatch = line.match(regexpNewDir)
              if (newdirMatch) {
                // const stepaths = (newdirMatch[3] || '').split('/')
                // const [name] = stepaths.slice(-1)
                // console.log(`Dir ${name} doesn't exits in backup yet`)
                // entries.push({ name, isdir: true, type: 'new' })
                const node = this.tree.getNodeByKey(newdirMatch[3])
                node.missing = true
              }
            }
          }
        }
      })
    },
    node_checked (node) {
      if (node.checked !== null) {
        recursiveChecked(node)
        upsideInform(node.parent)
      }
    },
    async load (dir) {
      try {
        const entries = await fs.readdir(dir)
        const childrens = []
        for (const entry of entries) {
          try {
            const fullname = path.join(dir, entry)
            const stat = await fs.stat(fullname)
            const isDirectory = stat.isDirectory()
            childrens.push({
              parent: node,
              isdir: isDirectory,
              path: fullname,
              name: entry,
              icon: isDirectory ? 'folder' : 'description',
              lazy: isDirectory,
              expandable: isDirectory,
              checked: !!node.checked,
              stat: stat
            })
          } catch (err) {
            warn(err)
          }
        }
        childrens.sort(compare)
        this.childrens = childrens
        this.checkdir()
      } catch (err) {
        warn(err)
        fail(err)
      }
    }
  },
  mounted () {
    this.load(this.name)
  }
  */
}
</script>

<style scoped lang="scss">
  .bkit-explorer {
    height:100%;
    display: flex;
    flex-direction: column;
    overflow-y:hidden;
    .bkit-toolbar {
      flex-shrink:0 ;
    }
    .bkit-splitter {
      flex-shrink: 1;
      flex-grow: 1;
      overflow-y: hidden;
    }
  }
</style>

<style lang="scss">
  .bkit-explorer{
    .bkit-splitter {
      .q-icon {
        font-size: initial;
      }
    }
  }
</style>
