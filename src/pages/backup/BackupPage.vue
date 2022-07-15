<template>
  <q-page padding class="fit">
    <div class="row no-wrap fit">
      <div style="flex-shrink: 0" class="disks column no-wrap items-center">
        <img alt="bKit logo" src="~assets/logotipo.svg" style="height:5vmin;min-height:45px" @click="$router.push('/')"/>
        <span class="text-center">Disks</span>
        <q-tabs
          v-model="disktab"
          vertical
          dense
          no-caps
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
            <span class="disk">{{diskname(disk)}}</span>
            <tooltip v-if="disklabel(disk)" :label="disklabel(disk)"/>
          </q-tab>
        </q-tabs>
        <q-btn icon="sync" size="xs" flat color="bkit" @click="load"/>
      </div>
      <q-tab-panels v-model="disktab" animated :keep-alive="false" class="fit">
        <q-tab-panel
          class="fit"
          :name="disk.id"
          v-for="disk in disks"
          :key="disk.id">
            <explorer v-bind="disk"/>
        </q-tab-panel>
      </q-tab-panels>
    </div>
    <q-inner-loading :showing="loading">
      <q-spinner-ios size="100px" color="loader"/>
    </q-inner-loading>
  </q-page>
</template>

<script>

import explorer from './components/Explorer'
// import restore from './components/Restore'
// import backup from './components/Backup'
import tooltip from 'src/components/tooltip'
import { listLocalDisks } from 'src/helpers/bkit'
import { listDisksOnBackup } from 'src/helpers/api'
// n
import { mapGetters } from 'vuex'
import { pInfo } from 'src/boot/computer'

const makeKey = (a, b) => `${a || '_'}-${b || '_'}`
export default {
  name: 'backup',
  data () {
    return {
      loading: false,
      mark: 0,
      dst: '',
      disktab: '',
      disks: []
      // restores: [],
      // backups: [],
    }
  },
  computed: {
    ...mapGetters('accounts', ['currentAccount']),
    ...mapGetters('view', ['getview']),
    ...mapGetters('backups', { lastBackupDone: 'getLastCompleted' }),
    onlyLocalDisks () {
      return this.disks.filter(d => !d.rvid)
    },
    onlyRemoteDisks () {
      return this.disks.filter(d => !d.mountpoint)
    },
    // newDiskOnBackup () {
    //   console.log('newDiskOnBackup', this.onlyLocalDisks)
    //   return this.onlyLocalDisks.some(d => this.wasUpdated(d.mountpoint))
    // },
    splitter: {
      get: function () {
        const length = 10
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
    diskname () {
      return disk => {
        const name = disk.name.replace(/\\$/, '') // remove ending backslash
        if (name && name !== '_') {
          return `${name}`
        } else return ''
      }
    },
    disklabel () {
      return disk => {
        // console.log(disk.label, disk.name)
        if (disk.label && disk.label !== '_') {
          return `${disk.label}`
        } else if (!disk.name || disk.name === '_') {
          return `[${disk.uuid}]`
        } else return ''
      }
    },
    color () {
      return disk => {
        if (disk.rvid && disk.mountpoint) {
          return 'ok'
        } else if (disk.rvid) {
          return 'missing'
        } else return 'initial'
      }
    },
    showConsole () {
      // return this.restores.length > 0
      return 0
    }
  },
  watch: {
    currentAccount () {
      this.disks = []
      this.load()
    },
    lastBackupDone ({ path }) {
      // Test if some local disk is the mounting point of backup
      if (this.onlyLocalDisks.some(d => path.startsWith(d.mountpoint))) {
        this.getDisksOnBackup()
      }
    },
    // newDiskOnBackup (val) { // Refresh list of remote disks
    //   console.log('Check new disks on backup')
    //   this.getDisksOnBackup()
    // },
    getview (val, old) {
      // A complex test to see if we need to change from one tab to another
      if (val && old && // just to avoid errors
        (
          // For at least a local disk
          val.mountpoint !== old.mountpoint || // Change from one tab to a another when mountpoints are different
          // For both remote disks
          (!val.mountpoint && val.rvid !== old.rvid) // Or when there is no mountpoint and RVID are different
          // We can't only rely on rvid, because a NOT backup node don't have a rvid
        )
      ) {
        // Change tab if new view is in a different disk
        const id = makeKey(val.mountpoint, val.rvid)
        this.disktab = id
      }
    }
  },
  components: {
    explorer,
    tooltip
  },
  methods: {
    async getDisksOnBackup () {
      const disks = await listDisksOnBackup() || []
      for (const rvid of disks) {
        console.log('RVID:', rvid)
        // const [letter, uuid, label] = rvid.split('.')
        const match = rvid.match(/^(?<letter>.)\.(?<uuid>[^.]+)\.(?<label>.+)\.(.+)\.(.+)$/)
        if (!match) continue
        const { letter, uuid, label } = match.groups
        const index = this.disks.findIndex(e => e.uuid === uuid && e.label === label)
        if (index >= 0) {
          const id = makeKey(this.disks[index].mountpoint, rvid)
          const updatedisk = { ...this.disks[index], rvid, letter, id }
          this.disks.splice(index, 1, updatedisk) // as requested by Vue reactiveness
        } else {
          const id = makeKey(undefined, rvid)
          this.disks.push({ name: letter, rvid, uuid, label, letter, id })
        }
      }
    },
    async getLocalDisks () {
      const disks = await listLocalDisks() || []

      for (const disk of disks) {
        console.log('Local disk:', disk)
        const pattern = disk.replace(/\|(?=\|)/g, '|_') // replace all the sequences '||' by '|_|'
        const [mountpoint, label, uuid, fs] = pattern.split(/\|/)
        const name = mountpoint
        const index = this.disks.findIndex(e => e.uuid === uuid && e.label === label)
        if (index >= 0) {
          const id = makeKey(mountpoint, this.disks[index].rvid)
          const updatedisk = { ...this.disks[index], name, mountpoint, label, uuid, fs, id }
          this.disks.splice(index, 1, updatedisk) // as requested by Vue reactiveness
        } else {
          const id = makeKey(mountpoint, undefined)
          this.disks.push({ name, mountpoint, label, uuid, fs, id })
        }
      }
    },
    // restore (resource) {
    //   // resource.options.push('--dry-run')
    //   this.restores.push(resource)
    // },
    recover (resource) {
      // resource.options.push('--dry-run')
      this.restores.push(resource)
    },
    // backup (path, done) {
    //   this.backups.push({ path, done })
    // },
    destroy_restore (index) {
      this.restores.splice(index, 1)
    },
    // destroy_backup (index) {
    //   this.backups.splice(index, 1)
    //   console.log('Destroy', index, this.backups)
    // },
    async load () {
      this.loading = true
      await this.getLocalDisks()
      await this.getDisksOnBackup()
      this.loading = false
    }
  },
  async mounted () {
    this.load()
    const { computer, localUser } = await pInfo
    console.log('COMPUTER', computer)
    console.log('localUser', localUser)
  },
  beforeRouteEnter (to, from, next) {
    // console.log('beforeRouteEnter', to)
    next()
    // called before the route that renders this component is confirmed.
    // does NOT have access to `this` component instance,
    // because it has not been created yet when this guard is called!
  },
  beforeRouteUpdate (to, from, next) {
    // console.log('beforeRouteUpdate', to)
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
  .console {
    background-color: $console;
    border: 2px solid $console-border;
  }
  .disk {
    max-width: 3em;
    overflow-x: hidden;
  }
 .disks:hover .disk{
    max-width: initial;
    overflow-x: initial;
  }
</style>
