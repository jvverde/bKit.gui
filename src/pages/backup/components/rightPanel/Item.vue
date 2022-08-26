<template>
  <div class="q-pa-xs bkit-item row">
    <div class="column no-wrap items-start">
      <b-icon v-if="isForbidden"
        :hint="errorString"
        size="xs"
        class="bkit-icon self-center"
        name="block"
        color="error">
      </b-icon>
      <b-icon v-else-if="isdir"
        :hint="description"
        class="bkit-icon self-start"
        style="cursor:pointer"
        name="folder"
        @click="open"
        :color="getcolor">
      </b-icon>
      <b-icon v-else
        :hint="description"
        class="bkit-icon self-start"
        name="description"
        :color="getcolor">
      </b-icon>
      <div class="bkit-text" @click="debug">
        {{name}}
      </div>
      <div v-if="onbackup"
        style="margin-top:auto"
        class="row text-weight-thin no-wrap">
        <q-btn-dropdown no-caps flat no-wrap
          icon="assignment"
          :color="hasversions ? 'versions' : 'noversions'"
          label="Versions"
          class="text-weight-thin"
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
        <q-list dense style="min-width: 10px">
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
      <wrap type="q-btn" flat no-caps stack
        hint="Starts an immediate backup"
        color="backup"
        icon="backup"
        size="xs"
        dense
        ripple
        @click="backup"
        :class="{inactive: !showBackup}">
        <span>Backup</span>
      </wrap>
      <wrap type="q-btn" flat no-caps stack
        hint="Recover to a different location"
        :color="needUpdate ? 'reset' : 'restore'"
        icon="restore"
        size="xs"
        dense
        ripple
        @click="restore"
        :class="{inactive: !isRestorable}">
        <span>Restore</span>
      </wrap>
      <b-btn flat no-caps stack
        hint="Recover to a different location"
        color="recover"
        icon="save_alt"
        size="xs"
        dense
        ripple
        @click="recover"
        :class="{inactive: !isRecoverable}">
        <span>Recover</span>
      </b-btn>
    </div>
  </div>
</template>

<script>
import wrap, { bBtn, bIcon } from 'src/components/wrapper'
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
    wrap,
    bIcon,
    bBtn
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
      text-align: center;
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
