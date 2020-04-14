<template>
  <q-page padding class="bkit-page row no-wrap">
    <!-- content -->
    <div style="flex-shrink: 0" class="column no-wrap items-center">
      <img alt="bKit logo" src="~assets/logotipo.svg" style="height:5vmin;min-height:45px">
      <span class="text-center">Disks</span>
      <q-tabs
        v-model="tab"
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
        <q-tab-panels v-model="tab" animated keep-alive class="bkit-panels">
          <q-tab-panel
            class="bkit-panel"
            :name="disk.rvid"
            v-for="disk in disks"
            :key="disk.rvid">
              <remoteexplorer :disk="disk" @restore="restore"/>
          </q-tab-panel>
        </q-tab-panels>
        <q-inner-loading :showing="loading">
          <q-spinner-gears size="100px" color="primary"/>
        </q-inner-loading>
      </template>
      <template v-slot:after>
        <q-list separator class="q-pa-xd">
          <restore
            v-for="(resource, index) in restores"
            :key="index"
            :resource="resource"
            @destroy="destroy(index)"
          />
        </q-list>
      </template>
    </q-splitter>
  </q-page>
</template>

<script>
import remoteexplorer from './components/remoteExplorer'
import restore from './components/Restore'
import * as bkit from 'src/helpers/bash'
export default {
  name: 'Server',
  data () {
    return {
      loading: true,
      tab: '',
      disks: [],
      currentdisk: {},
      recoverydir: undefined,
      mark: 0,
      restores: []
    }
  },
  components: {
    remoteexplorer,
    restore
  },
  computed: {
    splitter: {
      get: function () {
        return this.mark >= 50
          ? this.mark
          : Math.max(50, 100 - 15 * this.restores.length)
      },
      set: function (val) {
        this.mark = Math.max(50, val)
      }
    }
  },
  methods: {
    select (index) {
      this.tab = this.disks[index].rvid
    },
    find_mountpoint (disk) {
      console.log('Find dev with', disk.uuid)
      bkit.bash('lib/getdev.sh', [disk.uuid], {
        onclose: () => console.log('Close getdev'),
        onreadline: (data) => {
          this.$nextTick(() => {
            disk.mountpoint = data
            disk.present = true
          })
        },
        onerror: (err) => {
          console.warn(`Getdev: ${err}`)
        }
      })
    },
    restore (resource) {
      this.restores.push(resource)
    },
    destroy (index) {
      this.restores.splice(index, 1)
    }
  },
  mounted () {
    bkit.bash('./listdisks.sh', [], {
      onclose: (code) => {
        this.$nextTick(() => {
          this.loading = false
          if (this.disks.length === 1) this.select(0)
        })
        console.log(`Script listdisks ends with code ${code}`)
      },
      onreadline: (data) => {
        console.log('LISTDISK:', data)
        let [ letter, uuid, label, , ] = data.split('.')
        let diskname = ''
        if (letter !== '_') {
          diskname = letter + ':'
          if (label !== '_') diskname += ` [${label}]`
        } else if (label !== '_') {
          diskname = label
        } else {
          diskname = uuid
        }
        this.$nextTick(() => {
          const disk = {
            name: diskname,
            rvid: data,
            uuid: uuid,
            mountpoint: '*',
            present: false
          }
          this.find_mountpoint(disk)
          this.disks.push(disk)
          this.select(0)
        })
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
