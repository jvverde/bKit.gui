<template>
  <div class="bkit-explorer">
    <q-toolbar class="bkit-toolbar">
      <keep-alive>
        <snaps :disk="disk" v-on:usesnap="usesnap"></snaps>
      </keep-alive>
    </q-toolbar>
    <q-toolbar inset>
      <q-breadcrumbs gutter="xs">
        <q-breadcrumbs-el
          style="cursor:pointer"
          v-for="(step, index) in steps" :key="index"
          @click="stepto(1 + index)"
          :label="step"/>
      </q-breadcrumbs>
    </q-toolbar>

    <q-splitter
      class="bkit-splitter"
      v-for="snap in snaps"
      :key="snap"
      v-show="currentsnap && currentsnap === snap"
      :limits="[0, 80]"
      v-model="splitterModel">

      <template v-slot:before>
        <div class="q-pa-md">
          <q-tree
            :ref="snap"
            accordion
            :nodes="rootsof[snap]"
            node-key="path"
            label-key="name"
            color="secondary"
            selected-color="positive"
            :selected.sync="selected"
            @lazy-load="lazy_load"
            @update:selected="selectdir"
          >
            <template v-slot:default-header="prop">
              <div class="row items-center" style="width:100%">
                <q-icon class="q-mr-xs" name="folder" color="amber" size="xs"/>
                <span class="ellipsis">{{ prop.node.name }}</span>
                <askuser
                  :entry="prop.node"
                  :disk="disk"
                  :snap="currentsnap"
                  @restore="restore"
                  style="margin-left:auto"/>
              </div>
            </template>
            <template v-slot:body-recovering="prop">
              <span>Recovering:</span> {{ prop.node.path }}
            </template>
          </q-tree>
        </div>
      </template>

      <template v-slot:after>
        <div class="q-pa-md">
          <q-list dense v-if="currentnodes.length > 0">

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

              <q-item-section no-wrap>
                <q-item-label>{{dir.date}}</q-item-label>
              </q-item-section>

              <q-item-section side>
                <askuser
                  :entry="dir"
                  :disk="disk"
                  :snap="currentsnap"
                  @restore="restore"/>
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
                  @restore="restore"/>
              </q-item-section>
            </q-item>

          </q-list>
        </div>
      </template>
    </q-splitter>
  </div>
</template>
<script>
const moment = require('moment')
moment.locale('en')
const regexpSize = /([a-z-]+)\s+([0-9,]+)\s+([0-9/]+)\s+([0-9:]+)\s+(.+)/
import snaps from './Snaps'
import askuser from './Askuser'
import * as bkit from 'src/helpers/bkit'
export default {
  name: 'backupexplorer',
  components: {
    snaps,
    askuser
  },
  data () {
    return {
      splitterModel: 30,
      selected: '.',
      rootsof: {},
      selectedof: {},
      snaps: [],
      currentsnap: null,
      currentnodes: []
    }
  },
  props: {
    disk: {
      type: Object,
      required: true
    }
  },
  computed: {
    dirs: function () {
      return this.currentnodes.filter(node => node.isdir)
    },
    files: function () {
      return this.currentnodes.filter(node => !node.isdir)
    },
    steps: function () {
      return this.selected.split('/')
    }
  },
  methods: {
    stepto (index) {
      const keypath = this.steps.slice(0, index).join('/')
      console.log('keypath=', keypath)
      this.selectdir(keypath)
    },
    usesnap (snap) {
      if (!this.snaps.includes(snap)) this.snaps.push(snap)
      this.selectedof[this.currentsnap] = this.selected
      this.currentsnap = snap
      if (!this.rootsof[snap]) {
        this.rootsof[snap] = [{
          name: `${this.disk.mountpoint}`,
          path: '.',
          lazy: true
        }]
        this.$nextTick(() => {
          this.selectdir('.')
        })
      } else {
        this.selectdir(this.selectedof[snap] || '.')
      }
    },
    selectdir (key) {
      if (!key) return
      this.selected = key
      const tree = this.$refs[this.currentsnap][0]
      const node = tree.getNodeByKey(key)
      this.currentnodes = node.nodes || []
      tree.setExpanded(key, true)
    },
    restore (...args) {
      this.$emit('restore', ...args)
    },
    lazy_load ({ node, key, done, fail }) {
      console.log('lazy_load:', key)
      const dirs = []
      const nodes = []
      function compare (a, b) {
        if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
        if (a.name.toLowerCase() > b.name.toLowerCase()) return 1
        return 0
      }
      bkit.bash('./listdirs.sh', [
        `--rvid=${this.disk.rvid}`,
        `--snap=${this.currentsnap}`,
        `${key}/`
      ], {
        onclose: () => {
          dirs.sort(compare)
          nodes.sort(compare)
          node.nodes = nodes
          done(dirs)
          this.$nextTick(() => {
            if (this.selected === key) this.currentnodes = node.nodes
          })
        },
        onreadline: (data) => {
          const match = data.match(regexpSize)
          if (!match) return
          if (match[5] === '.') return // omitt . directory
          const entry = {
            isdir: match[1].match(/^d/) !== null,
            isregular: match[1].match(/^-/) !== null,
            path: `${key}/${match[5]}`,
            name: match[5],
            date: `${match[3]} ${match[4]}`,
            size: match[2]
          }
          if (entry.isdir) {
            dirs.push(Object.assign({}, entry, { icon: 'folder', lazy: true, body: '' }))
          }
          nodes.push(entry)
        }
      })
    }
  },
  mounted () {
    this.snaps[this.disk.snap] = [{
      name: '/',
      path: '.',
      icon: 'folder',
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
        // font-size: initial;
      }
    }
  }
</style>
