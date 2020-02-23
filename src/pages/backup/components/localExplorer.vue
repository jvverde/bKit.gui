<template>
  <div class="bkit-explorer">
    <q-splitter
      class="bkit-splitter"
      :limits="[0, 80]"
      v-model="splitterModel">

      <template v-slot:before>
        <div class="q-pa-md">
          <q-tree
            accordion
            :nodes="root"
            node-key="path"
            label-key="name"
            color="secondary"
            selected-color="positive"
            @lazy-load="lazy_load"
          >
            <template v-slot:default-header="prop">
              <div class="row items-center" style="width:100%">
                <q-checkbox
                  :indeterminate-value="null"
                  toggle-indeterminate
                  v-model="prop.node.checked"
                  keep-color
                  size="xs"
                  color="positive"
                  @click.native="node_checked(prop.node)"/>
                <q-icon class="q-mr-xs" :name="prop.node.icon" color="amber" size="xs"/>
                <span class="ellipsis">{{ prop.node.name }}</span>
              </div>
            </template>
            <template v-slot:body-recovering="prop">
              <span>Recovering:</span> {{ prop.node.name}}
            </template>
          </q-tree>
        </div>
      </template>

      <template v-slot:after>
        <div class="q-pa-md">

        </div>
      </template>
    </q-splitter>
  </div>
</template>
<script>

import { warn } from 'src/helpers/notify'
// import * as bkit from 'src/helpers/bkit'
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

export default {
  name: 'localexplorer',
  data () {
    return {
      splitterModel: 80,
      selected: '.',
      root: [],
      selectedof: {},
      currentsnap: null,
      currentnodes: []
    }
  },
  props: {
    name: {
      type: String,
      required: true
    }
  },
  methods: {
    selectdir () {
      console.log('selecdir')
    },
    node_checked (node) {
      if (node.checked !== null) {
        recursiveChecked(node)
        upsideInform(node.parent)
      }
    },
    async lazy_load ({ node, key, done, fail }) {
      try {
        const entries = await fs.readdir(key)
        const childrens = []
        for (const entry of entries) {
          const fullpath = path.join(key, entry)
          const stat = await fs.stat(fullpath)
          const isDirectory = stat.isDirectory()
          childrens.push({
            parent: node,
            isdir: isDirectory,
            path: fullpath,
            name: entry,
            icon: isDirectory ? 'folder' : 'description',
            lazy: isDirectory,
            expandable: isDirectory,
            checked: !!node.checked,
            stat: stat
          })
        }
        childrens.sort(compare)
        done(childrens)
      } catch (err) {
        warn(err)
        fail(err)
      }
    }
  },
  mounted () {
    this.root = [{
      parent: null,
      name: this.name,
      path: this.name,
      icon: 'folder',
      expandable: true,
      checked: false,
      lazy: true
    }]
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
