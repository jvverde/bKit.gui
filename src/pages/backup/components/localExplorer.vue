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
            tickStrategy="leaf"
            selected-color="positive"
            :ticked.sync="ticked"
            @lazy-load="lazy_load"
          >
            <template v-slot:default-header="prop">
              <div class="row items-center" style="width:100%">
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
<!--           <q-list dense v-if="currentnodes.length > 0">

            <q-item clickable v-ripple v-for="dir in dirs" :key="dir.path" @click="selectdir(dir.path)">
              <q-item-section side>
                <q-icon name="folder" size="xs" color="amber"/>
              </q-item-section>

              <q-item-section no-wrap>
                <q-item-label>{{dir.name}}</q-item-label>
              </q-item-section>

              <q-item-section no-wrap>
                <q-item-label class="text-right">{{dir.size}}</q-item-label>
              </q-item-section>

              <q-item-section no-warp>
                <q-item-label>{{dir.date}}</q-item-label>
              </q-item-section>

              <q-item-section side>
                <askuser
                  :entry="dir"
                  :disk="disk"
                  :snap="currentsnap"
                  @backup="backup"/>
              </q-item-section>
            </q-item>

            <q-item v-ripple v-for="file in files" :key="file.path">
              <q-item-section side>
                <q-icon name="description" color="primary" size="xs"/>
              </q-item-section>

              <q-item-section no-wrap>
                <q-item-label>{{file.name}}</q-item-label>
              </q-item-section>

              <q-item-section no-wrap>
                <q-item-label class="text-right">{{file.size}}</q-item-label>
              </q-item-section>

              <q-item-section no-warp>
                <q-item-label>{{file.date}}</q-item-label>
              </q-item-section>

              <q-item-section side v-if="file.isregular">
                <askuser
                  :entry="file"
                  :disk="disk"
                  :snap="currentsnap"
                  @backup="backup"/>
              </q-item-section>
            </q-item>

          </q-list> -->
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

export default {
  name: 'localexplorer',
  data () {
    return {
      splitterModel: 30,
      selected: '.',
      root: [],
      selectedof: {},
      ticked: [],
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
    async lazy_load ({ node, key, done, fail }) {
      try {
        const entries = await fs.readdir(key)
        const childrens = []
        for (const entry of entries) {
          const fullpath = path.join(key, entry)
          const stat = await fs.stat(fullpath)
          const isDirectory = stat.isDirectory()
          childrens.push({
            isdir: isDirectory,
            path: fullpath,
            name: entry,
            icon: isDirectory ? 'folder' : 'description',
            lazy: isDirectory,
            expandable: isDirectory,
            tickable: true,
            stat: stat
          })
        }
        childrens.sort(compare)
        done(childrens)
        console.log('root', this.root)
      } catch (err) {
        warn(err)
        fail(err)
      }
    }
  },
  mounted () {
    this.root = [{
      name: this.name,
      path: this.name,
      icon: 'folder',
      expandable: true,
      tickable: true,
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
