<template>
  <q-page padding class="bkit-page row no-wrap">
    <div style="flex-shrink: 0" class="column no-wrap items-center">
      <img alt="bKit logo" src="~assets/logotipo.svg" style="height:5vmin;min-height:45px">
      <span class="text-center">Local Disks</span>
      <q-tabs
        v-model="disktab"
        vertical
        dense
        no-caps
        switch-indicator
        active-bg-color="grey-2"
        active-color="primary">
        <q-tab
          v-for="disk in disks"
          :key="disk.uuid"
          :name="disk.uuid"
          icon="far fa-hdd"
          :alert="alert(disk)"
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
            :name="disk.uuid"
            v-for="disk in disks"
            :key="disk.uuid">
              <localexplorer v-bind="disk" @backup="backup"/>
          </q-tab-panel>
        </q-tab-panels>
        <q-inner-loading :showing="loading">
          <q-spinner-ios size="100px" color="amber"/>
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

// var developer = {
//   title: 'Developer',
//   department: 'I.T.',
//   location: 'Building 3, 2nd Floor'
// }

// var techLeadTitle = { title: 'Tech Lead', location: 'new location' }

// var techLead = { ...developer, ...techLeadTitle }

// console.log(techLead)

import localexplorer from './components/localExplorer'
import { listDisksOnBackup, listLocalDisks } from 'src/helpers/bkit'
export default {
  name: 'Backup',
  data () {
    return {
      loading: false,
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
    alert (disk) {
      if (disk.present === true) {
        return 'green'
      } else if (disk.present === false) {
        return 'red'
      } else return false
    },
    diskname  (disk) {
      const name = disk.name.replace(/\\$|\/$/, '')
      if (name && name !== '_' && disk.label && disk.label !== '_') {
        return `${disk.label} (${name})`
      } else if (name && name !== '_') {
        return `${name}`
      } else if (disk.label && disk.label !== '_') {
        return `${disk.label}`
      } else return `[${disk.uuid}]`
    },
    async getDisksOnBackup () {
      for await (const rvid of listDisksOnBackup()) {
        console.log('RVID:', rvid)
        const [letter, uuid, label] = rvid.split('.')
        const index = this.disks.findIndex(e => e.uuid === uuid)
        if (index >= 0) {
          const updatedisk = { ...this.disks[index], rvid, letter, present: true }
          this.disks.splice(index, 1, updatedisk) // as requested by Vue reactiveness
        } else {
          this.disks.push({ name: letter, rvid, uuid, label, letter, mountpoint: undefined, present: false })
        }
      }
    },
    async getLocalDisks () {
      for await (const disk of listLocalDisks()) {
        console.log('Local disk', disk)
        const [mountpoint, label, uuid, fs] = disk.split(/\|/)
        const name = mountpoint
        this.disks.push({ name, mountpoint, label, uuid, fs })
      }
    }
  },
  async mounted () {
    this.loading = true
    await this.getLocalDisks()
    await this.getDisksOnBackup()
    this.loading = false
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
