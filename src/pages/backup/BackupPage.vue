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
        style="background-color: ghostwhite"
        indicator-color="active"
        active-bg-color="white">
        <q-tab
          v-for="disk in disks"
          :key="disk.id"
          :name="disk.id"
          :disable="loading"
          :ripple="{ early: true, color: 'indigo'}"
          icon="far fa-hdd"
          :class="'text-' + color(disk)"
        >
          <div class="row no-wrap" style="color:initial">
            <span>{{diskname(disk)}}</span>
            <span v-if="disk.present === true">
              <q-icon name="done" color="ok"/>
            </span>
            <span v-else-if="disk.present === false">
              <q-icon name="priority_high" color="missing"/>
            </span>
          </div>
        </q-tab>
      </q-tabs>
    </div>
    <q-splitter
      style="flex-grow: 1"
      class="bkit-spliter-horizontal"
      :limits="[10, 99]"
      horizontal
      v-model="splitter">
      <template v-slot:before>
        <q-tab-panels v-model="disktab" animated keep-alive class="bkit-panels">
          <q-tab-panel
            class="bkit-panel"
            :name="disk.id"
            v-for="disk in disks"
            :key="disk.id">
              <explorer v-bind="disk" @backup="backup" @restore="restore" @recover="recover"/>
          </q-tab-panel>
        </q-tab-panels>
        <q-inner-loading :showing="loading">
          <q-spinner-ios size="100px" color="loader"/>
        </q-inner-loading>
      </template>
      <template v-slot:after>
        <div  class="console fit rounded-borders scroll" v-if="showConsole">
          <q-list separator class="q-pa-xd" dark>
            <restore
              v-for="(resource, index) in restores"
              :key="'R-' + index"
              :resource="resource"
              @destroy="destroy_restore(index)"
            />
            <backup
              v-for="(backup, index) in backups"
              :key="'P-' + index"
              :path="backup.path"
              :done="backup.done"
              @destroy="destroy_backup(index)"
            />
          </q-list>
        </div>
      </template>
    </q-splitter>
  </q-page>
</template>

<script>

import explorer from './components/Explorer'
import restore from './components/Restore'
import backup from './components/Backup'
import { listDisksOnBackup, listLocalDisks } from 'src/helpers/bkit'

export default {
  name: 'Backup',
  data () {
    return {
      loading: false,
      mark: 0,
      dst: '',
      disktab: '',
      disks: [],
      restores: [],
      backups: [],
      currentdisk: {}
    }
  },
  computed: {
    splitter: {
      get: function () {
        const length = 10 * (this.restores.length + this.backups.length)
        if (this.mark === 0) return Math.max(30, 100 - length)
        else if (length > 2 * this.mark) {
          return Math.max(30, 100 - 0.6 * length)
        }
        return Math.max(30, 100 - this.mark)
      },
      set: function (val) {
        this.mark = 100 - val
      }
    },
    server () {
      return this.$store.state.global.server
    },
    showConsole () {
      return this.backups.length > 0 || this.restores.length > 0
    }
  },
  watch: {
    server () {
      this.disks = []
      this.load()
    }
  },
  components: {
    explorer,
    restore,
    backup
  },
  methods: {
    color (disk) {
      if (disk.present === true) {
        return 'ok'
      } else if (disk.present === false) {
        return 'missing'
      } else return 'initial'
    },
    badge (disk) {
      if (disk.present === true) {
        return '&#10003;'
      } else if (disk.present === false) {
        return '&#10005;'
      } else return ''
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
      const disks = await listDisksOnBackup() || []
      for (const rvid of disks) {
        console.log('RVID:', rvid)
        const [letter, uuid, label] = rvid.split('.')
        const index = this.disks.findIndex(e => e.uuid === uuid && e.label === label)
        if (index >= 0) {
          const updatedisk = { ...this.disks[index], rvid, letter, present: true, id: rvid }
          this.disks.splice(index, 1, updatedisk) // as requested by Vue reactiveness
        } else {
          this.disks.push({ name: letter, rvid, uuid, label, letter, id: rvid, mountpoint: undefined, present: false })
        }
      }
    },
    async getLocalDisks () {
      const disks = await listLocalDisks() || []
      for (const disk of disks) {
        console.log('Local disk:', disk)
        const disk2 = disk.replace(/\|(?=\|)/g, '|_') // replace all the sequences '||' by '|_|'
        const [mountpoint, label, uuid, fs] = disk2.split(/\|/)
        const name = mountpoint
        this.disks.push({ name, mountpoint, label, uuid, fs, id: disk2 })
      }
    },
    restore (resource) {
      // resource.options.push('--dry-run')
      this.restores.push(resource)
    },
    recover (resource) {
      // resource.options.push('--dry-run')
      this.restores.push(resource)
    },
    backup (path, done) {
      this.backups.push({ path, done })
    },
    destroy_restore (index) {
      this.restores.splice(index, 1)
    },
    destroy_backup (index) {
      this.backups.splice(index, 1)
      console.log('Destroy', index, this.backups)
    },
    async load () {
      this.loading = true
      await this.getLocalDisks()
      await this.getDisksOnBackup()
      this.loading = false
    }
  },
  mounted () {
    this.load()
  },
  beforeRouteEnter (to, from, next) {
    console.log('beforeRouteEnter', to)
    next()
    // called before the route that renders this component is confirmed.
    // does NOT have access to `this` component instance,
    // because it has not been created yet when this guard is called!
  },
  beforeRouteUpdate (to, from, next) {
    console.log('beforeRouteUpdate', to)
    next()
    // called when the route that renders this component has changed,
    // but this component is reused in the new route.
    // For example, for a route with dynamic params `/foo/:id`, when we
    // navigate between `/foo/1` and `/foo/2`, the same `Foo` component instance
    // will be reused, and this hook will be called when that happens.
    // has access to `this` component instance.
  }
}
</script>

<style scoped lang="scss">
  @import 'src/css/app.scss';
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
  .console {
    background-color: $console;
    border: 2px solid $console-border;
  }
</style>
