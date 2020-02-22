<template>
  <q-page padding class="bkit-page row no-wrap">
    <div style="flex-shrink: 0" class="column no-wrap items-center">
      <img alt="bKit logo" src="~assets/logotipo.svg" style="height:5vmin;min-height:45px">
      <span class="text-center">Disks</span>
      <q-tabs
        v-model="disktab"
        align="left"
        vertical
        dense
        switch-indicator
        active-bg-color="grey-2"
        active-color="primary">
        <q-tab
          v-for="(disk,index) in disks"
          :key="disk.rvid"
          :name="disk.rvid"
          icon="far fa-hdd"
          :alert="disk.present ? false : 'red'"
          :label="disk.name"
          @click="select(index)">
        </q-tab>
      </q-tabs>
    </div>
    <q-splitter
      style="flex-grow: 1"
      class="bkit-spliter-horizontal"
      :limits="[50, 100]"
      horizontal
      v-model="splitter">
      <template v-slot:before>
        <q-tab-panels v-model="disktab" animated keep-alive class="bkit-panels">
          <q-tab-panel
            class="bkit-panel"
            :name="disk.rvid"
            v-for="disk in disks"
            :key="disk.rvid">
              <!-- <fileexplorer :disk="disk" @restore="restore"/> -->
          </q-tab-panel>
        </q-tab-panels>
        <q-inner-loading :showing="loading">
          <q-spinner-gears size="100px" color="primary"/>
        </q-inner-loading>
      </template>
      <template v-slot:after>
        <q-list separator class="q-pa-xd">
<!--           <restore
            v-for="(resource, index) in restores"
            :key="index"
            :resource="resource"
            @destroy="destroy(index)"
          /> -->
        </q-list>
      </template>
    </q-splitter>
  </q-page>
</template>

<script>
// import fileexplorer from './components/fileExplorer'
// import restore from './components/Restore'
// import * as bkit from 'src/helpers/bkit'
export default {
  name: 'Backup',
  data () {
    return {
      loading: true,
      splitter: 95,
      disktab: '',
      disks: [],
      currentdisk: {}
    }
  },
  mounted () {
    const drivelist = require('drivelist')
    drivelist.list()
  }
}
</script>

<style scoped lang="scss">
  .bkit-page {
    height: 100%;
    overflow-y: hidden;
    .bkit-spliter-horizontal {
      overflow-y:hidden;
      height:100%;
      .bkit-panels{
        overflow-y: hidden;
        height:100%;
        .bkit-panel {
          display: flex;
          flex-direction: column;
          height:100%;
        }
      }
    }
  }
</style>
