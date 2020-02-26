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
              <q-icon
                v-if="entry.isdir"
                name="folder"
                style="font-size:8em"
                color="amber"/>
              <q-icon
                v-else-if="entry.isfile"
                name="description"
                style="font-size:8em"
                :color="colorosOf[entry.type]"/>
              <q-icon
                v-else-if="entry.type === 'deleted'"
                name="delete_sweep"
                style="font-size:8em"
                color="red-7"/>
              <div
                style="max-width:8em;overflow-wrap: break-word; text-align:center">
                {{entry.name}}
              </div>
              type:{{entry.type}}
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
const regexpDelete = /^[*]deleting\s*[|]([^|]*)[|]([^|]*)[|]([^|]*)/

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

async function* readdir (dir) {
  const files = await fs.readdir(dir)
  for (const file of files) {
    try { // catch error individualy. This way it doesn't ends the loop
      const fullpath = path.join(dir, file)
      const stat = await fs.lstat(fullpath)
      const isdir = stat.isDirectory()
      yield {
        path: fullpath,
        name: file,
        isdir,
        isfile: !isdir,
        stat
      }
    } catch (err) {
      warn(err)
    }
  }
}
export default {
  name: 'localexplorer',
  data () {
    return {
      splitterModel: 55,
      selected: false,
      root: [],
      children: [],
      colorosOf: {
        deleted: 'red',
        updated: 'green',
        new: 'black',
        modified: 'amber'
      },
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
    show (fullpath) {
      this.checkdir(fullpath)
    },
    changeView (entries) {
      this.currentfiles = []
      entries.sort(compare)
      this.$nextTick(() => {
        this.currentfiles = entries
      })
    },
    checkdir (fullpath) {
      console.log('Check entry:', fullpath)
      const entries = []
      bkit.bash('./dkit.sh', [
        '--no-recursive',
        '--delete',
        '--dirs',
        `${fullpath}`
      ], {
        onclose: () => {
          (async () => {
            const stat = await fs.lstat(fullpath)
            if (stat.isDirectory()) {
              // console.log('start waitv for', fullpath)
              const updated = []
              for await (const entry of readdir(fullpath)) {
                // console.log('await entry', entry)
                if (!entries.find(e => e.path === entry.path)) {
                  entry.type = 'updated'
                  updated.push(entry)
                }
              }
              // console.log('updated:', updated.map(e => e.name))
              // console.log('entries:', entries.map(e => e.name))
              updated.push(...entries)
              this.changeView(updated)
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
                if (dirname === fullpath) return
                const stepaths = dirname.split('/')
                const [name] = stepaths.slice(-1)
                console.log(`Dir ${name} doesn't exits in backup yet`)
                entries.push({ name, isdir: true, type: 'new', path: dirname })
              } else {
                const deletingMatch = line.match(regexpDelete)
                if (deletingMatch) {
                  const delname = deletingMatch[3] || ''
                  const base = path.dirname(fullpath)
                  const fullname = path.join(base, delname)
                  const dirname = path.dirname(fullname)
                  console.log('dirname', dirname)
                  const name = path.basename(fullname)
                  if (dirname !== path.normalize(fullpath)) return
                  console.log(`Resource ${name} deleted`)
                  entries.push({ name, type: 'deleted', path: fullname })
                }
              }
            }
          }
        }
      })
    }
  }
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
