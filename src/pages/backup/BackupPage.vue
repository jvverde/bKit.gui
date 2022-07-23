<template>
  <q-page padding class="fit">
    <div class="row no-wrap fit">
      <div style="flex-shrink: 0;" class="disks column no-wrap items-center full-height">
        <img alt="bKit logo" src="~assets/logotipo.svg" style="height:3%;" @click="$router.push('/')"/>
        <svg viewBox="0 0 60 15" xmlns="http://www.w3.org/2000/svg" height="1%">
          <text x="50%" y="50%">Disks</text>
        </svg>
        <q-tabs class="q-mt-lg"
          v-model="disktab"
          vertical
          dense
          no-caps
          outside-arrows
          mobile-arrows
          style="background-color: ghostwhite; max-height: 86%"
          indicator-color="active"
          active-bg-color="grey-3">
          <q-tab
            v-for="disk in sortDisks"
            :key="disk.id"
            :name="disk.id"
            :disable="loading"
            :ripple="{ early: true, color: 'indigo'}"
            icon="far fa-hdd"
            :style="diskHasLetter(disk) ? '' : 'padding-left: 0px; padding-right: 0px'"
            :class="'text-' + color(disk)"
          >
            <div v-if="diskHasLetter(disk)" class="disk">{{diskname(disk)}}</div>
            <svg v-else viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg" width="5vw">
              <text  x="50%" y="50%">{{diskname(disk)}}</text>
            </svg>
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

const sameComputer = (a, b) => {
  return a.uuid === b.uuid && a.user === b.user && a.name === b.name && a.domain === b.domain
}

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
      }
    }
  },
  computed: {
    ...mapGetters('accounts', ['currentAccount']),
    ...mapGetters('view', ['getview']),
    ...mapGetters('backups', { lastBackupDone: 'getLastCompleted' }),
    ...mapGetters('clients', ['isCurrentClient', 'isSelectedClient', 'getSelectedClient']),
    ...mapGetters('options', ['getOption']),
    all () { return this.getOption('showForeignDisks') },
    diskHasLetter () {
      return d => d.name !== '_'
    },
    amIselectedClient () {
      return this.getSelectedClient === undefined || this.isSelectedClient(this.computer)
    },
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
      return this.disks.filter(d => sameComputer(this.computer, d.computer))
    },
    foreignBackups () { // Backups of another computers
      const uuid = this.computer.uuid
      return this.disks.filter(d => d.computer.uuid && d.computer.uuid !== uuid)
    },
    selectedForeignBackups () {
      const selected = this.getSelectedClient
      const foreign = this.foreignBackups
      return selected ? foreign.filter(d => sameComputer(d, selected)) : foreign
    },
    sortDisks () {
      const owndisks = this.amIselectedClient ? [...this.ownDisks].sort(compareDisks) : []
      const fdisks = [...this.selectedForeignBackups].sort(compareByDomain)
      return [...owndisks, ...fdisks]
    },
    getDiskById () {
      return id => this.disks.find(d => d.id === id)
    },
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
        return disk.name.replace(/\\$/, '').replace(/^_$/, disk.label) // remove ending backslash
      }
    },
    appendDomain () {
      return disk => {
        const { computer, mountpoint } = disk
        if (mountpoint) return ''
        return this.isCurrentClient(computer) ? '' : ` [${computer.user}@${computer.name}.${computer.domain}]`
      }
    },
    disklabel () {
      return disk => {
        // console.log(disk.label, disk.name)
        if (disk.label && disk.label !== '_') {
          return disk.label + this.appendDomain(disk)
        } else if (disk.name && disk.name !== '_') {
          return disk.name + this.appendDomain(disk)
        } else return disk.uuid + this.appendDomain(disk)
      }
    },
    color () {
      return disk => {
        if (disk.rvid && disk.mountpoint) {
          return 'ok'
        } else if (disk.rvid && this.amIcurrentClient) {
          return 'missing'
        } else if (disk.rvid) {
          return 'foreign'
        } else return 'initial'
      }
    }
  },
  watch: {
    disks (val) {
      const dup = val.map(d => d.computer).map(c => {
        const fullUserName = `${c.user}@${c.name}.${c.domain}`
        const id = `${fullUserName}(${c.uuid})`
        return { ...c, id, fullUserName }
      })
      const unique = [...new Map(dup.map(c => [c.id, c])).values()]
      this.setClients(unique)
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
        const index = this.disks.findIndex(e => e.uuid === uuid && sameComputer(e.computer, computer))
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
        const index = this.disks.findIndex(e => e.uuid === uuid && e.label === label && sameComputer(e.computer, computer))
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
  svg text{
    text-anchor: middle;
    dominant-baseline: middle;
  }
</style>
