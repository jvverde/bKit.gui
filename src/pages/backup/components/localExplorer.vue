<template>
  <div class="bkit-explorer relative-position">
    <q-toolbar inset>
      <q-breadcrumbs gutter="xs" separator-color="amber">
        <q-breadcrumbs-el
          v-if="steps.length > 0"
          style="cursor:pointer"
          @click="stepto(0)"
          icon="far fa-hdd"/>
        <q-breadcrumbs-el
          style="cursor:pointer"
          v-for="(step, index) in steps" :key="index"
          @click="stepto(1 + index)"
          :label="step"/>
      </q-breadcrumbs>
    </q-toolbar>
    <q-splitter
      class="bkit-splitter"
      :limits="[0, 80]"
      v-model="verticalSplitter">

      <template v-slot:before>
        <q-list class="rounded-borders">
          <tree
            :path="mountpoint"
            :name="mountpoint"
            :currentNode.sync="currentNode"
            :selected.sync="selectedNode"
            @show="show"/>
        </q-list>
      </template>

      <template v-slot:after>
        <div class="q-pa-md row justify-evenly q-gutter-md items-stretch relative-position">
          <item
            v-for="entry in currentfiles"
            :key="entry.path"
            :entry="entry"
            @open="open"
            class="column"/>
          <q-inner-loading :showing="loading">
            <q-spinner-gears size="100px" color="primary"/>
          </q-inner-loading>
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
      verticalSplitter: 55,
      selectedNode: false,
      selectedpath: '',
      loading: false,
      currentNode: this.mountpoint,
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
  computed: {
    steps: function () {
      const relative = path.relative(this.mountpoint, this.selectedpath)
      return this.selectedpath !== '' ? `${relative}`.split('/') : []
    }
  },
  methods: {
    open (path) {
      this.currentNode = path
      console.log('Set currentNode', this.currentNode)
      this.show(path)
    },
    stepto (index) {
      const fullpath = path.join(this.mountpoint, this.steps.slice(0, index).join('/'))
      console.log('go to', fullpath)
      this.show(fullpath)
    },
    async show (fullpath) {
      const updated = []
      this.currentfiles = []
      this.loading = true
      for await (const entry of readdir(fullpath)) {
        entry.status = 'local'
        updated.push(entry)
      }
      console.log('Update', fullpath)
      this.selectedpath = fullpath
      this.$nextTick(() => {
        this.select(updated)
        this.checkdir(fullpath)
      })
    },
    select (entries) {
      entries.sort(compare)
      this.currentfiles = [...entries]
    },
    selectNextTick (entries) {
      this.$nextTick(() => {
        this.select(entries)
      })
    },
    checkdir (fullpath) {
      console.log(`Check ${fullpath} status on server`)
      const entries = this.currentfiles
      let cnt = 0
      let lasttime = Date.now()
      const update = (entry) => {
        const status = 'onbackup'
        const index = entries.findIndex(e => e.path === entry.path)
        if (index > -1) {
          entries[index] = Object.assign(entries[index], { status }, entry)
        } else {
          entries.push(Object.assign({ status }, entry))
        }
        if (Date.now() - lasttime > 600) {
          this.selectNextTick(entries)
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
          this.selectNextTick(entries)
        },
        onreadline: (data) => {
          console.log('Data:', data)
          const regexpSize = /([a-z-]+)\s+([0-9,]+)\s+([0-9/]+)\s+([0-9:]+)\s+(.+)/
          const match = data.match(regexpSize)
          if (match && match[5] !== '.') { // only if not current directory
            const name = match[5]
            const status = 'onbackup'
            const fullname = path.join(fullpath, name)
            update({ name, status, path: fullname })
          }
        }
      })
      const onRsyncLine = bkit.onRsyncLine({
        close: () => {
          console.log('dkit done...')
          if (this.selectedpath === fullpath) this.loading = false
          this.selectNextTick(entries)
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
          entry.path = newpath
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
