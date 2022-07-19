<template>
  <q-page padding class="fit">
    <div class="row no-wrap fit">
      <div style="flex-shrink: 0;" class="disks column no-wrap items-center">
        <img alt="bKit logo" src="~assets/logotipo.svg" style="height:5vmin;min-height:45px" @click="$router.push('/')"/>
        <span class="text-center">Disks</span>
        <div class="q-gutter-sm">
          <q-checkbox dense v-model="all" label="All" color="button" />
        </div>
        <q-tabs class="q-mt-lg"
          v-model="disktab"
          vertical
          dense
          no-caps
          :outside-arrows="false"
          :mobile-arrows="false"
          style="background-color: ghostwhite"
          indicator-color="active"
          active-bg-color="white">
          <q-tab
            v-for="disk in sortDisks"
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
      <div class="fit">
        <q-tab-panels v-model="disktab" animated :keep-alive="false" class="fit">
          <q-tab-panel
            class="fit"
            :name="disk.id"
            v-for="disk in sortDisks"
            :key="disk.id">
              <explorer :disk="disk"/>
          </q-tab-panel>
        </q-tab-panels>
      </div>
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
import { listDisksOnBackup, listAllDisksOnBackup } from 'src/helpers/api'
// n
import { mapGetters, mapMutations } from 'vuex'
import { pInfo } from 'src/boot/computer'
import { compareDisks, compareByDomain, getId, isSameDisk } from 'src/helpers/disks'

const getComputer = disk => {
  const { domain, name, uuid, profile: user } = disk
  return { domain, name, uuid, user }
}

const sameComputerUUID = (a, b) => a.uuid === b.uuid

export default {
  name: 'backup',
  data () {
    return {
      loading: false,
      mark: 0,
      dst: '',
      disktab: '',
      disks: [],
      computer: {
        uuid: undefined,
        name: undefined,
        domain: undefined,
        user: undefined
      },
      all: false
      // restores: [],
      // backups: [],
    }
  },
  computed: {
    ...mapGetters('accounts', ['currentAccount']),
    ...mapGetters('view', ['getview']),
    ...mapGetters('backups', { lastBackupDone: 'getLastCompleted' }),
    ...mapGetters('clients', ['isCurrentClient']),
    getRemoteDisks () {
      return this.all ? listAllDisksOnBackup : listDisksOnBackup
    },
    disksNotInBackup () { // Local disks without backup
      return this.disks.filter(d => !d.rvid)
    },
    localDisks () { // Local disks without backup
      return this.disks.filter(d => d.mountpoint)
    },
    ownDisks () { // Disks and backups belonging to this computer
      return this.disks.filter(d => sameComputerUUID(this.computer, d.computer))
    },
    foreignBackups () { // Backups of another computers
      const uuid = this.computer.uuid
      return this.disks.filter(d => d.computer.uuid && d.computer.uuid !== uuid)
    },
    sortDisks () {
      const owndisks = [...this.ownDisks].sort(compareDisks)
      const fdisks = [...this.foreignBackups].sort(compareByDomain)
      console.log('owndisks', owndisks)
      return [...owndisks, ...fdisks]
    },
    getDiskById () {
      return id => this.disks.find(d => d.id === id)
    },
    // newDiskOnBackup () {
    //   console.log('newDiskOnBackup', this.disksNotInBackup)
    //   return this.disksNotInBackup.some(d => this.wasUpdated(d.mountpoint))
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
        return name
        // if (name && name !== '_') {
        //   return `${name}`
        // } else return ''
      }
    },
    appendDomain () {
      return disk => {
        const { computer, mountpoint } = disk
        if (mountpoint) return ''
        return this.isCurrentClient(computer) ? '' : `@${computer.name}.${computer.domain}`
      }
    },
    disklabel () {
      return disk => {
        // console.log(disk.label, disk.name)
        if (disk.label && disk.label !== '_') {
          return `${disk.label}` + this.appendDomain(disk)
        } else if (!disk.name || disk.name === '_') {
          return `[${disk.uuid}]` + this.appendDomain(disk)
        } else return '' + this.appendDomain(disk)
      }
    },
    color () {
      return disk => {
        if (disk.rvid && disk.mountpoint) {
          return 'ok'
        } else if (disk.rvid && this.isCurrentClient(disk.computer)) {
          return 'missing'
        } else if (disk.rvid) {
          return 'foreign'
        } else return 'initial'
      }
    }
  },
  watch: {
    disks (val) {
      this.setClients([...val])
    },
    disktab (val, o) {
      // When disktab change we need to switch to correspondent client/computer
      // const disk = this.getDiskById(val)
    },
    currentAccount () { // Reset disk list when current account change
      this.disks = []
      this.load()
    },
    lastBackupDone ({ path }) {
      // Test if some of "not yet in backup disk" is the mounting point of last backup
      if (this.disksNotInBackup.some(d => path.startsWith(d.mountpoint))) {
        this.getDisksOnBackup()
      }
    },
    // newDiskOnBackup (val) { // Refresh list of remote disks
    //   console.log('Check new disks on backup')
    //   this.getDisksOnBackup()
    // },
    getview (view, old) {
      // We need to change from one tab to another when view change from one disk to another
      if (old && !isSameDisk(view, old)) {
        console.log('Change to tab', view.id, view)
        this.disktab = view.id
      }
    },
    all () {
      this.refreshRemoteDisks()
    }
  },
  components: {
    explorer,
    tooltip
  },
  methods: {
    ...mapMutations('clients', ['setCurrentClient', 'setClients']),
    async getDisksOnBackup () {
      const disks = await this.getRemoteDisks() || []
      for (const disk of disks) {
        const rvid = disk.volume
        const computer = getComputer(disk)
        console.log('RVID:', rvid, disk)
        // const [letter, uuid, label] = rvid.split('.')
        const match = rvid.match(/^(?<letter>.)\.(?<uuid>[^.]+)\.(?<label>.+)\.(.+)\.(?<fs>.+)$/)
        if (!match) continue
        const { letter, uuid, label, fs } = match.groups
        const index = this.disks.findIndex(e => e.uuid === uuid && sameComputerUUID(e.computer, computer))
        if (index >= 0) {
          const d = { ...this.disks[index], computer, rvid, letter, uuid, label, fs }
          const id = getId(d)
          this.disks.splice(index, 1, { ...d, id }) // as requested by Vue reactiveness
        } else {
          const d = { computer, name: letter, rvid, letter, uuid, label, fs }
          const id = getId(d)
          this.disks.push({ ...d, id })
        }
      }
      // console.log('Disks:', this.disks)
    },
    refreshRemoteDisks () {
      this.disks = this.localDisks
      this.getDisksOnBackup()
    },
    async getLocalDisks () {
      const disks = await listLocalDisks() || []
      const computer = this.computer

      for (const disk of disks) {
        console.log('Local disk:', disk)
        const pattern = disk.replace(/\|(?=\|)/g, '|_') // replace all the sequences '||' by '|_|'
        const [mountpoint, label, uuid, fs] = pattern.split(/\|/)
        const name = mountpoint
        const letter = mountpoint.substring(0, 1)
        const index = this.disks.findIndex(e => e.uuid === uuid && e.label === label && sameComputerUUID(e.computer, computer))
        if (index >= 0) {
          const d = { ...this.disks[index], name, letter, mountpoint, label, uuid, fs, computer }
          const id = getId(d)
          this.disks.splice(index, 1, { ...d, id }) // as requested by Vue reactiveness
        } else {
          const d = { name, mountpoint, letter, label, uuid, fs, computer }
          const id = getId(d)
          this.disks.push({ ...d, id })
        }
      }
    },
    // restore (resource) {
    //   // resource.options.push('--dry-run')
    //   this.restores.push(resource)
    // },
    // ecover (resource) {
    // resource.options.push('--dry-run')
    // this.restores.push(resource)
    // },
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
    const { computer, localUser: user } = await pInfo
    this.computer = { ...computer, user }
    this.setCurrentClient(this.computer)
    this.load()
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
