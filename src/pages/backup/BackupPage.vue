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
            :style="disk.hasLetter ? '' : 'padding-left: 0px; padding-right: 0px'"
            :class="'text-' + color(disk)"
          >
            <div v-if="disk.hasLetter" class="disk">{{disk.diskname}}</div>
            <svg v-else viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg" width="5vw">
              <text  x="50%" y="50%">{{disk.diskname}}</text>
            </svg>
            <tooltip :label="disklabel(disk)"/>
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
import { Disk, compareDisks, compareByDomain, isSameDisk } from 'src/helpers/disks'

const getComputer = disk => {
  const { domain, name, uuid, profile: user } = disk
  return { domain, name, uuid, user }
}

// const sameComputer = (a, b) => {
// return a.uuid === b.uuid && a.user === b.user && a.name === b.name && a.domain === b.domain
// }

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
    showAll () { return this.getOption('showForeignDisks') },
    amIselectedClient () {
      return this.getSelectedClient === undefined || this.isSelectedClient(this.computer)
    },
    getRemoteDisks () {
      return this.showAll ? listAllDisksOnBackup : listDisksOnBackup
    },
    disksNotInBackup () { // Local disks without backup
      return this.disks.filter(d => !d.rvid)
    },
    localDisks () { // Local disks without backup
      return this.disks.filter(d => d.mountpoint)
    },
    ownDisks () { // Disks and backups belonging to this computer
      return this.disks.filter(d => d.isOnComputer(this.computer))
    },
    foreignBackups () { // Backups of another computers
      const uuid = this.computer.uuid
      return this.disks.filter(d => d.computer.uuid && d.computer.uuid !== uuid)
    },
    selectedForeignBackups () {
      const selected = this.getSelectedClient
      const foreign = this.foreignBackups
      return selected ? foreign.filter(d => d.isOnComputer(selected)) : foreign
    },
    sortDisks () {
      const owndisks = this.amIselectedClient ? [...this.ownDisks].sort(compareDisks) : []
      const fdisks = [...this.selectedForeignBackups].sort(compareByDomain)
      return [...owndisks, ...fdisks]
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
    disklabel () {
      return disk => {
        return this.isCurrentClient(disk.computer) ? disk.labelname : disk.fulllabel
      }
    },
    color () {
      return disk => {
        if (disk.onBothSides) {
          return 'ok'
        } else if (disk.isBackup && this.amIselectedClient) {
          return 'missing'
        } else if (disk.isBackup) {
          return 'foreign'
        } else return 'initial'
      }
    }
  },
  watch: {
    disks (val) {
      // compute a new list of clients based on (extracted from) list of disks
      const dup = val.map(d => d.computer).map(c => {
        const fullUserName = `${c.user}@${c.name}.${c.domain}`
        const id = `${fullUserName}(${c.uuid})`
        return { ...c, id, fullUserName }
      })
      const unique = [...new Map(dup.map(c => [c.id, c])).values()]
      this.setClients(unique)
    },
    currentAccount () { // Reset disk list when current account change
      this.disks = []
      this.load()
    },
    lastBackupDone ({ path }) {
      // Test if some of "not yet in backup " disk is the mounting point of last backup
      if (this.disksNotInBackup.some(d => path.startsWith(d.mountpoint))) {
        this.getDisksOnBackup()
      }
    },
    getview (view, old) {
      // We need to change from one tab to another when view change from one disk to another
      if (old && !isSameDisk(view, old)) {
        console.log('Change to tab', view.id, view)
        this.disktab = view.id
      }
    },
    showAll () {
      this.disks = this.localDisks // Only leave local disks
      this.getDisksOnBackup()
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
        const match = rvid.match(/^(?<letter>.)\.(?<uuid>[^.]+)\.(?<label>.+)\.(.+)\.(?<fs>.+)$/)
        if (!match) continue
        const { letter, uuid, label, fs } = match.groups
        const index = this.disks.findIndex(e => e.uuid === uuid && e.isOnComputer(computer))
        if (index >= 0) {
          const d = { ...this.disks[index], computer, rvid, letter, uuid, label, fs }
          this.disks.splice(index, 1, new Disk(d)) // as requested by Vue reactiveness
        } else {
          const d = { computer, name: letter, rvid, letter, uuid, label, fs }
          this.disks.push(new Disk(d))
        }
      }
    },
    async getLocalDisks () {
      const disks = await listLocalDisks() || []
      const computer = this.computer

      for (const disk of disks) {
        const pattern = disk.replace(/\|(?=\|)/g, '|_') // replace showAll the sequences '||' by '|_|'
        const [mountpoint, label, uuid, fs] = pattern.split(/\|/)
        const name = mountpoint
        const letter = mountpoint.substring(0, 1)
        const index = this.disks.findIndex(e => e.uuid === uuid && e.label === label && e.isOnComputer(computer))
        if (index >= 0) {
          const d = { ...this.disks[index], name, letter, mountpoint, label, uuid, fs, computer }
          this.disks.splice(index, 1, new Disk(d)) // as requested by Vue reactiveness
        } else {
          const d = { name, mountpoint, letter, label, uuid, fs, computer }
          this.disks.push(new Disk(d))
        }
      }
    },
    destroy_restore (index) {
      this.restores.splice(index, 1)
    },
    async load () {
      this.loading = true
      await this.getLocalDisks()
      await this.getDisksOnBackup()
      // console.log('disk.names', this.disks.map(d => d.diskname))
      this.loading = false
    }
  },
  async mounted () {
    const { computer, localUser: user } = await pInfo
    this.computer = { ...computer, user }
    this.setCurrentClient(this.computer)
    this.load()
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
