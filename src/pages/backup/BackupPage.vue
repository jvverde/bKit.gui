<template>
  <q-page padding class="bkit-page row no-wrap">
    <div style="flex-shrink: 0" class="column no-wrap items-center">
      <img alt="bKit logo" src="~assets/logotipo.svg" style="height:5vmin;min-height:45px">
      <span class="text-center">Local Disks</span>
      <q-tabs
        v-model="disktab"
        align="left"
        vertical
        dense
        no-caps
        switch-indicator
        inline-label
        active-bg-color="grey-2"
        active-color="primary">
        <q-tab
          v-for="disk in disks"
          :key="disk"
          :name="disk"
          icon="far fa-hdd"
          :label="diskname(disk)">
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
            :name="disk"
            v-for="disk in disks"
            :key="disk">
              <localexplorer :mountpoint="disk" @backup="backup"/>
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
import localexplorer from './components/localExplorer'
import * as bkit from 'src/helpers/bkit'
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
  components: {
    localexplorer
  },
  methods: {
    backup () {
      console.log('dobackup')
    },
    diskname  (disk) {
      return disk.replace(/\\$/, '')
    }
  },
  mounted () {
    bkit.bash('./lib/local/listdisks.sh', [], {
      onclose: (code) => {
        this.$nextTick(() => {
          this.loading = false
          // if (this.disks.length === 1) this.select(0)
        })
      },
      onreadline: (drive) => {
        console.log('list local disks:', drive)
        this.disks.push(drive)
      }
    })
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
