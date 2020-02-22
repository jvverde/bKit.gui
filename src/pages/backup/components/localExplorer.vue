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
      :limits="[0, 80]"
      v-model="splitterModel">

      <template v-slot:before>
        <div class="q-pa-md">
          <q-tree
            :ref="snap"
            accordion
            :nodes="root"
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

              <q-item-section no-warp>
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

import * as bkit from 'src/helpers/bkit'
export default {
  name: 'localexplorer',
  data () {
    return {
      splitterModel: 30,
      selected: '.',
      root: [],
      selectedof: {},
      snaps: [],
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
  },
  mounted () {
    this.root = [{
      name: this.name,
      path: this.name,
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
        font-size: initial;
      }
    }
  }
</style>
