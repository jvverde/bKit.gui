<template>
  <div class="q-pa-xs bkit-item row">
    <div class="column no-wrap items-left">
      <q-icon v-if="isForbidden"
        class="bkit-icon self-start"
        name="block"
        color="error">
      </q-icon>
      <q-icon v-else-if="isdir"
        class="bkit-icon self-start"
        style="cursor:pointer"
        name="folder"
        @click="open"
        :color="getcolor">
        <tooltip :label="description"/>
      </q-icon>
      <q-icon v-else
        class="bkit-icon self-start"
        name="description"
        :color="getcolor">
        <tooltip :label="description"/>
      </q-icon>
      <div class="bkit-text" @click="debug">
        {{name}}
      </div>
      <div v-if="onbackup"
        style="margin-top:auto"
        class="row text-weight-light no-wrap">
        <q-btn-dropdown no-caps flat no-wrap
          icon="assignment"
          :color="hasversions ? 'versions' : 'noversions'"
          label="Versions"
          class="text-weight-light"
          :loading="loading"
          strech
          dense
          size="sm"
          @click="getVersions"
          >
          <q-list separator class="q-pa-xd" >
            <q-item dense
              clickable
              v-close-popup
              @click="onVersionClick(version)"
              v-for="version in versions"
              :key="version.t">
              <q-item-section>
                {{version.date}}
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
      <q-menu auto-close context-menu fit anchor="bottom start" self="top left" v-if="isdir">
        <q-list dense style="min-width: 100px">
          <q-item clickable v-close-popup @click="open">
            <q-item-section>Open</q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="backup" :disable="!onlocal">
            <q-item-section>Backup</q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="restore" :disable="!onbackup">
            <q-item-section>Restore</q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="recover" :disable="!isRecoverable">
            <q-item-section>Recover</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </div>
    <div class="column justify-start">
      <q-btn flat no-caps stack
        color="backup"
        icon="backup"
        size="sm"
        dense
        ripple
        @click="backup"
        :class="{inactive: !showBackup}">
        <span class="text-weight-light">Backup</span>
      </q-btn>
      <q-btn flat no-caps stack
        :color="needUpdate ? 'reset' : 'restore'"
        icon="restore"
        size="sm"
        dense
        ripple
        @click="restore"
        :class="{inactive: !isRestorable}">
        <span class="text-weight-light">Restore</span>
        <tooltip label="Restore to original location"/>
      </q-btn>
      <q-btn flat no-caps stack
        color="recover"
        icon="save_alt"
        size="sm"
        dense
        ripple
        @click="recover"
        :class="{inactive: !isRecoverable}">
        <span class="text-weight-light">Recover</span>
        <tooltip label="Recover to a different location"/>
      </q-btn>
    </div>
  </div>
</template>

<script>
// import { getVersions } from 'src/helpers/bkit'
import tooltip from 'src/components/tooltip'
import entry from 'src/mixins/entry'
import { getChanges } from 'src/helpers/api'
import { mapMutations, mapGetters } from 'vuex'
import { bkitPath } from 'src/utils/misc'

// const path = require('path')

const moment = require('moment')
moment.locale('en')

export default {
  name: 'item',
  data () {
    return {
      versions: [],
      loading: false
    }
  },
  mixins: [entry],
  components: {
    tooltip
  },
  computed: {
    ...mapGetters('view', ['getview']),
    ...mapGetters('snaps', ['getCurrentSnap']),
    hasversions () { return this.versions.length > 0 }
  },
  methods: {
    ...mapMutations('view', ['setView']),
    ...mapMutations('snaps', ['setCurrentSnap']),
    open () {
      const view = { ...this.getview, path: this.path }
      console.log('Set view on open to ', view)
      this.setView(view)
    },
    onVersionClick (v) {
      console.log('Version snap', v)
      const cur = this.getCurrentSnap
      this.setCurrentSnap({ ...cur, snap: v.t })
      // this.$emit('usesnap', snap)
    },
    async getVersions () {
      const versions = []
      this.loading = true
      const { rvid, snap, fullpath, mountpoint, isdir } = this
      const upath = bkitPath(mountpoint, fullpath)
      console.log('getChanges for', rvid, snap, upath)
      try {
        const entries = await getChanges(rvid, snap, isdir ? `${upath}/` : upath)
        console.log('Version:', entries)
        entries.forEach(e => versions.push({ ...e, date: moment.utc(e.t.substring(5), 'YYYY.MM.DD-HH.mm.ss').local() }))
      } catch (err) {
        console.error('Catch in getChanges', err)
      } finally {
        this.loading = false
        this.versions = versions
      }
    },
    debug () {
      console.log(this)
    }
  },
  mounted () {
    // console.log('entry:', this.entry)
  }
}
</script>

<style scoped lang="scss">
  $bkitsize: 5em;
  $biconsize: $bkitsize;
  .bkit-item {
    min-width: 2 * $bkitsize;
    .bkit-text{
      max-width: 1 * $bkitsize;
      overflow-wrap: break-word;
      text-align:center;
      font-size: small;
    }
    .bkit-icon{
      font-size: $biconsize;
    }
  }
  .inactive {
    color: transparent !important;
    pointer-events: none;
  }
</style>
