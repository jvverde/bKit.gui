<template>
  <div class="q-pa-xs bkit-item">
    <div class="column no-wrap items-left">
      <q-icon v-if="isdir"
        class="bkit-icon self-start"
        style="cursor:pointer"
        name="folder"
        @click="open"
        :color="getcolor">
        <q-menu touch-position context-menu>
          <q-list dense style="min-width: 100px">
            <q-item clickable v-close-popup>
              <q-item-section>Open...</q-item-section>
            </q-item>
            <q-item clickable v-close-popup>
              <q-item-section>New</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
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
      <!-- div v-if="hasbackup && !wasdeleted"
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
              @click="onVersionClick(version.snap)"
              v-for="version in versions"
              :key="version.snap">
              <q-item-section>
                {{version.date}}
              </q-item-section>
              <q-item-section side>
                <q-icon color="button" name="restore" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div -->
    </div>
    <!-- div class="column justify-start">
      <q-btn flat no-caps stack
        color="backup"
        icon="backup"
        size="sm"
        dense
        ripple
        @click="backup"
        :class="{inactive: !isBackupable}">
        <span class="text-weight-light">Backup</span>
      </q-btn>
      <q-btn flat no-caps stack
        :color="wasmodified ? 'reset' : 'restore'"
        icon="restore"
        size="sm"
        dense
        ripple
        @click="restore"
        :class="{inactive: !isRestorable}">
        <span class="text-weight-light">Restore</span>
        <tooltip label="Restore lo original location"/>
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
    </div -->
  </div>
</template>

<script>
// import { getVersions } from 'src/helpers/bkit'
import tooltip from 'src/components/tooltip'
import entry from 'src/mixins/entry'
import { mapGetters, mapMutations } from 'vuex'

// const path = require('path')

const moment = require('moment')
moment.locale('en')
// const obooleans = {
//   type: Boolean,
//   require: false
// }
// const colorOf = {
//   deleted: 'deleted',
//   update: 'updated',
//   new: 'orange',
//   modified: 'modified',
//   filtered: 'filtered',
//   unchecked: 'unchecked',
//   nobackup: 'nobackup'
// }
const nameOf = {
  deleted: 'Was deleted',
  updated: 'Is update',
  nobackup: 'Not in backup',
  modified: 'Was modified'
}
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
    isdir () { return this.entry.isdir },
    isfile () { return this.entry.isfile },
    name () { return this.entry.name },
    description () {
      return nameOf[this.status]
    }
    // color () { return this.isdir && this.isUpdate ? 'updatedir' : colorOf[this.status] },
    // description () { return nameOf[this.status] },
    // hasbackup () { return this.checked && this.onbackup },
    // wasdeleted () { return this.checked && this.onbackup && !this.onlocal },
    // isUpdate () { return this.checked && this.onbackup && this.onlocal && !this.wasmodified },
    // unchecked () { return !this.checked },
    // hasversions () { return this.versions.length > 0 },
    // status () {
    //   if (this.unchecked) {
    //     return 'unchecked'
    //   } else if (this.isnew) {
    //     return 'new'
    //   } else if (this.wasmodified) {
    //     return 'modified'
    //   } else if (this.wasdeleted) {
    //     return 'deleted'
    //   } else if (this.isUpdate) {
    //     return 'update'
    //   } else if (this.isfiltered) {
    //     return 'filtered'
    //   } else if (this.nobackup) {
    //     return 'nobackup'
    //   }
    //   return null
    // },
    // isBackupable () { return this.onlocal && (!this.isUpdate || this.isdir) },
    // isRestorable () { return this.wasmodified || this.wasdeleted || (this.isdir && this.hasbackup) },
    // isRecoverable () { return this.hasbackup }
  },
  methods: {
    ...mapMutations('view', ['setView']),
    open () {
      console.log('open:', this.path)
      this.setView(this.path)
      // this.$emit('open', this.path)
    },
    onVersionClick (snap) {
      console.log('Version snap', snap)
      this.$emit('usesnap', snap)
    },
    // async getVersions () {
    //   const versions = []
    //   this.loading = true
    //   // bkit.bash('./versions.sh', [this.path], {
    //   try {
    //     const entries = await getVersions(this.path)
    //     // console.log('Versions:', entries)
    //     entries.forEach(e => versions.push(e))
    //   } catch (err) {
    //     console.error('Catch in getVersions', err)
    //   } finally {
    //     this.loading = false
    //     this.versions = versions
    //   }
    // },
    restore () {
      this.$emit('restore', this.path, this.isdir)
    },
    recover () {
      this.$emit('recover', this.path, this.isdir)
    },
    backup () {
      this.$emit('backup', this.path)
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
