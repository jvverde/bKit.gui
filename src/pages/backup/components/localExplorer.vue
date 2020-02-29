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
        <div class="q-pa-md row justify-evenly q-gutter-md items-stretch">
          <item
            v-for="entry in currentfiles"
            :key="entry.path"
            :entry="entry"
            class="column"/>
        </div>
      </template>
    </q-splitter>
  </div>
</template>
<script>

// import { warn } from 'src/helpers/notify'
import * as bkit from 'src/helpers/bkit'
import tree from './tree'
import item from './item'
// import fs from 'fs-extra'
const path = require('path')

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
    tree,
    item
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
      let cnt = 0
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
      const updatedir = (entry) => {
        if (path.dirname(entry.path) !== fullpath) {
          console.log('Discard dir', entry.path)
          return
        }
        update(entry)
      }
      bkit.bash('./listdirs.sh', [fullpath], {
        onclose: () => {
          console.log('List dirs done')
          this.send2Current(entries)
        },
        onreadline: (data) => {
          console.log('Data:', data)
          const regexpSize = /([a-z-]+)\s+([0-9,]+)\s+([0-9/]+)\s+([0-9:]+)\s+(.+)/
          const match = data.match(regexpSize)
          if (match && match[5] !== '.') {
            const name = match[5]
            const fullpath = path.join(this.mountpoint, name)
            const entry = entries.find(e => e.path === fullpath)
            if (entry) {
              entry.onbackup = true
            }
          }
        }
      })
      const onRsyncLine = bkit.onRsyncLine({
        close: () => {
          console.log('dkit done')
          entries
            .filter(e => !('type' in e))
            .forEach(e => { e.type = 'updated' })
          this.send2Current(entries)
        },
        newDir: updatedir,
        chgDir: updatedir,
        newFile: update,
        chgFile: update,
        deleted: (entry) => {
          const newpath = path.join(this.mountpoint, entry.path)
          const dirname = path.dirname(newpath)
          if (dirname !== fullpath) {
            console.log('Discard deleted', entry.path)
            cnt++
            return
          } else {
            entry.descendants = cnt
            cnt = 0
          }
          update(entry)
        }
      })
      const args = ['--no-recursive', '--delete', '--dirs', `${fullpath}`]
      bkit.bash('./dkit.sh', args, onRsyncLine)
    }
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
