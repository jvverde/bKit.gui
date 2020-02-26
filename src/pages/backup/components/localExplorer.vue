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
                class="bkit-icon"
                name="folder"
                :color="colorosOf[entry.type]"/>
              <q-icon
                v-else-if="entry.isfile"
                class="bkit-icon"
                name="description"
                :color="colorosOf[entry.type]"/>
              <q-icon
                v-else-if="entry.type === 'deleted'"
                class="bkit-icon"
                name="delete_sweep"
                color="red-7"/>
              <div class="bkit-text">
                {{entry.name}}
              </div>
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

// import { warn } from 'src/helpers/notify'
import * as bkit from 'src/helpers/bkit'
import tree from './tree'
// import fs from 'fs-extra'
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

import { readdir } from 'src/helpers/readfs'

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
        updated: 'cyan',
        new: 'green',
        modified: 'blue'
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
    async show (fullpath) {
      const updated = []
      this.currentfiles = []
      for await (const entry of readdir(fullpath)) {
        // entry.type = 'updated'
        updated.push(entry)
      }
      console.log('Update', fullpath)
      this.$nextTick(() => {
        this.updateCurrent(updated)
        this.checkdir(fullpath)
      })
    },
    updateCurrent (entries) {
      entries.sort(compare)
      this.currentfiles = [...entries]
    },
    send2Current (entries) {
      this.$nextTick(() => {
        this.updateCurrent(entries)
      })
    },
    checkdir (fullpath) {
      console.log(`Check ${fullpath} status on server`)
      const entries = this.currentfiles
      let lasttime = Date.now()
      const update = (entrie) => {
        const index = entries.findIndex(e => e.path === entrie.path)
        if (index > -1) {
          entries[index] = entrie
        } else {
          entries.push(entrie)
        }
        if (Date.now() - lasttime > 1000) {
          this.send2Current(entries)
          lasttime = Date.now()
        }
      }
      bkit.bash('./dkit.sh', [
        '--no-recursive',
        '--delete',
        '--dirs',
        `${fullpath}`
      ], {
        onclose: () => {
          console.log('dkit done')
          entries
            .filter(e => !('type' in e))
            .forEach(e => { e.type = 'updated' })
          this.send2Current(entries)
        },
        onreadline: (line) => {
          console.log('Read from dkit:', line)
          matchLine(line, (entry) => {
            if (entry.isdir && path.dirname(entry.path) !== fullpath) {
              console.log('Discard dir', entry.path)
              return
            } else if (entry.type === 'deleted') {
              console.log('path', entry.path)
              console.log('fullpath', fullpath)
              const newpath = path.join(this.mountpoint, entry.path)
              console.log('newpath', newpath)
              const dirname = path.dirname(newpath)
              if (dirname !== fullpath) {
                console.log('Discard deleted', entry.path)
                return
              }
            }
            update(entry)
          })
          /*
          const newfileMatch = line.match(regexpNewFile)
          if (newfileMatch) { // if this file is will be new on backup
            const filename = newfileMatch[3] || ''
            const stepaths = filename.split('/')
            const [name] = stepaths.slice(-1)
            console.log(`File ${name} doesn't exits in backup yet`)
            update({ name, isfile: true, type: 'new', path: filename })
          } else {
            const chgFileMatch = line.match(regexpChgFile)
            if (chgFileMatch) {
              const filename = chgFileMatch[3] || ''
              const stepaths = filename.split('/')
              const [name] = stepaths.slice(-1)
              console.log(`File ${name} need update on backup yet`)
              update({ name, isfile: true, type: 'modified', path: filename })
            } else {
              const newdirMatch = line.match(regexpNewDir)
              if (newdirMatch) {
                const dirname = newdirMatch[3] || ''
                if (dirname === fullpath) return
                const stepaths = dirname.split('/')
                const [name] = stepaths.slice(-1)
                console.log(`Dir ${name} doesn't exits in backup yet`)
                update({ name, isdir: true, type: 'new', path: dirname })
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
                  update({ name, type: 'deleted', path: fullname })
                }
              }
            }
          }
          */
        }
      })
    }
  }
}

function matchLine (line, done = () => false) {
  const match = (line, exp, done) => {
    const isaMatch = line.match(exp)
    if (isaMatch) { // if this file is will be new on backup
      const filename = isaMatch[3] || ''
      const name = path.basename(filename)
      done({ name, path: filename })
      return true
    }
    return false
  }
  const newfile = (entry) => {
    entry.isfile = true
    entry.type = 'new'
    console.log('newfile', entry.path)
    done(entry)
  }
  const modified = (entry) => {
    entry.isfile = true
    entry.type = 'modified'
    console.log('modified', entry.path)
    done(entry)
  }
  const newdir = (entry) => {
    entry.isdir = true
    entry.type = 'new'
    console.log('newdir', entry.path)
    done(entry)
  }
  const removed = (entry) => {
    entry.type = 'deleted'
    console.log('deleted', entry.path)
    return done(entry)
  }
  if (!match(line, regexpNewFile, newfile) &&
      !match(line, regexpChgFile, modified) &&
      !match(line, regexpNewDir, newdir)) {
    match(line, regexpDelete, removed)
  }
}
</script>

<style scoped lang="scss">
  $bkitsize: 6em;
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
    .bkit-text{
      max-width:$bkitsize;
      overflow-wrap: break-word;
      text-align:center
    }
    .bkit-icon{
      font-size:$bkitsize;
    }
  }
</style>

<style lang="scss">
  .bkit-explorer{
    .bkit-splitter {
      .q-icon {
        // font-size: initial;
      }
    }
  }
</style>
