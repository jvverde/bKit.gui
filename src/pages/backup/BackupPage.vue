<template>
  <q-page padding class="fit">
    <div class="row no-wrap fit scroll">
      <div style="flex-shrink: 0" class="disks column no-wrap items-center">
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
import { listDisksOnBackup, listAllDisksOnBackup } from 'src/helpers/api'
// n
import { mapGetters, mapMutations } from 'vuex'
import { pInfo } from 'src/boot/computer'

const compareByUser = (a, b) => {
  if (a.user < b.user) return -1
  if (a.user > b.user) return 1
  return 0
}
const compareByUUID = (a, b) => {
  if (a.uuid < b.uuid) return -1
  if (a.uuid > b.uuid) return 1
  return compareByUser(a, b)
}
const compareByName = (a, b) => {
  if (a.name < b.name) return -1
  if (a.name > b.name) return 1
  return compareByUUID(a, b)
}
const compareByDomain = (a, b) => {
  if (a.domain < b.doman) return -1
  if (a.domain > b.domain) return 1
  return compareByName(a, b)
}
const compareByRVID = (a, b) => {
  if (a.rvid < b.rvid) return -1
  if (a.rvid > b.rvid) return 1
  return compareByDomain(a, b)
}
const compareDisks = (a, b) => {
  if (!a.mountpoint && !b.mountpoint) return compareByRVID(a, b)
  if (a.mountpoint && !b.mountpoint) return -1
  if (b.mountpoint && !a.mountpoint) return 1
  if (a.mountpoint < b.mountpoint) return -1
  if (a.mountpoint > b.mountpoint) return 1
  return 0
}

const makeKey = (...val) => val.join('>>')
export default {
  name: 'backup',
  data () {
    return {
      loading: false,
      mark: 0,
      dst: '',
      disktab: '',
      disks: [],
      client: {
        uuid: undefined,
        name: undefined,
        domain: undefined
      },
      all: false,
      user: undefined
      // restores: [],
      // backups: [],
    }
  },
  computed: {
    ...mapGetters('accounts', ['currentAccount']),
    ...mapGetters('view', ['getview']),
    ...mapGetters('backups', { lastBackupDone: 'getLastCompleted' }),
    ...mapGetters('client', ['getClient']),
    onThisClient () {
      return ({ uuid, name, domain }) => uuid === this.client.uuid && domain === this.client.domain && name === this.client.name
    },
    checkDisk () {
      return ({ computerUUID: uuid, computerName: name, domain }) => this.onThisClient({ uuid, name, domain })
    },
    onlyThisComputer: {
      get () {
        const { uuid, name, domain } = this.getClient || {}
        return this.onThisClient({ uuid, name, domain })
      },
      set (val) {
        if (val) {
          this.setClient(this.client)
        } else {
          this.setClient({ uuid: '*', name: '*', domain: '*' })
        }
      }
    },
    getRemoteDisks () {
      return this.all ? listAllDisksOnBackup : listDisksOnBackup
    },
    disksNotInBackup () { // Local disks without backup
      return this.disks.filter(d => !d.rvid)
    },
    ownDisks () { // Disks and backups belonging to this computer (with ou without backups)
      const uuid = this.client.uuid
      return this.disks.filter(d => d.mountpoint || d.computerUUID === uuid)
    },
    foreignBackups () { // Backups of another computers
      const uuid = this.client.uuid
      return this.disks.filter(d => d.computerUUID && d.computerUUID !== uuid)
    },
    sortDisks () {
      const owndisks = [...this.ownDisks].sort(compareDisks)
      const fdisks = [...this.foreignBackups].sort(compareByDomain)
      return [...owndisks, ...fdisks]
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
        const { computerUUID: uuid, computerName: name, domain, mountpoint } = disk
        if (mountpoint) return ''
        return this.onThisClient({ uuid, name, domain }) ? '' : `@${name}.${domain}`
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
        } else if (disk.rvid && this.checkDisk(disk)) {
          return 'missing'
        } else if (disk.rvid) {
          return 'foreign'
        } else return 'initial'
      }
    }
  },
  watch: {
    currentAccount () {
      this.disks = []
      this.load()
    },
    lastBackupDone ({ path }) {
      // Test if some local disk is the mounting point of last backup
      if (this.disksNotInBackup.some(d => path.startsWith(d.mountpoint))) {
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
        // const id = makeKey(val.mountpoint, val.rvid)
        const id = makeKey(val.mountpoint, val.uuid, val.rvid, val.computerUUID, val.computerName, val.domain, val.user)
        this.disktab = id
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
    ...mapMutations('client', ['setClient']),
    async getDisksOnBackup () {
      const disks = await this.getRemoteDisks() || []
      for (const disk of disks) {
        const { volume: rvid, domain, name: computerName, uuid: computerUUID, profile: user } = disk
        const remote = { rvid, computerName, computerUUID, domain, user }
        console.log('RVID:', rvid, disk)
        // const [letter, uuid, label] = rvid.split('.')
        const match = rvid.match(/^(?<letter>.)\.(?<uuid>[^.]+)\.(?<label>.+)\.(.+)\.(.+)$/)
        if (!match) continue
        const { letter, uuid, label } = match.groups
        const index = this.disks.findIndex(e => e.uuid === uuid && e.label === label && e.uuid !== '_')
        if (index >= 0 && computerUUID === this.client.uuid) {
          const id = makeKey(this.disks[index].mountpoint, uuid, rvid, computerUUID, computerName, domain, user)
          const updatedisk = { ...this.disks[index], ...remote, rvid, letter, id }
          this.disks.splice(index, 1, updatedisk) // as requested by Vue reactiveness
        } else {
          const id = makeKey(undefined, uuid, rvid, computerUUID, computerName, domain, user)
          this.disks.push({ ...remote, name: letter, rvid, uuid, label, letter, id })
        }
      }
      // console.log('Disks:', this.disks)
    },
    refreshRemoteDisks () {
      this.disks = this.disksNotInBackup
      this.getDisksOnBackup()
    },
    async getLocalDisks () {
      const disks = await listLocalDisks() || []
      const { uuid: computerUUID, name: computerName, domain } = this.client
      const user = this.user

      for (const disk of disks) {
        console.log('Local disk:', disk)
        const pattern = disk.replace(/\|(?=\|)/g, '|_') // replace all the sequences '||' by '|_|'
        const [mountpoint, label, uuid, fs] = pattern.split(/\|/)
        const name = mountpoint
        const index = this.disks.findIndex(e => e.uuid === uuid && e.label === label && e.computerUUID === computerUUID)
        if (index >= 0) {
          const id = makeKey(mountpoint, uuid, this.disks[index].rvid, computerUUID, computerName, domain, user)
          const updatedisk = { ...this.disks[index], name, mountpoint, label, uuid, fs, id, computerUUID, computerName, domain, user }
          this.disks.splice(index, 1, updatedisk) // as requested by Vue reactiveness
        } else {
          const id = makeKey(mountpoint, uuid, undefined, computerUUID, computerName, domain, user)
          this.disks.push({ name, mountpoint, label, uuid, fs, id, computerUUID, computerName, domain, user })
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
    const { computer, localUser } = await pInfo
    this.client = computer
    this.user = localUser
    this.setClient(this.client)
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
