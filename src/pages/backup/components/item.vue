<template>
  <div class="bkit-card q-pa-xs column no-wrap rounded-borders shadow-1">
    <div class="row no-wrap">
      <div class="column no-wrap items-center">
        <q-icon
          v-if="isdir"
          class="bkit-icon"
          style="cursor:pointer"
          name="folder"
          @click="open"
          :color="color">
          <q-tooltip anchor="top right" self="top middle"
            content-class="bg-grey-1 text-black shadow-4"
            transition-show="scale"
            transition-hide="scale">
            <span class="text-capitalize">{{description}}</span>
          </q-tooltip>
        </q-icon>
        <q-icon
          v-else
          class="bkit-icon"
          name="description"
          :color="color">
          <q-tooltip anchor="top right" self="top middle"
            content-class="bg-grey-1 text-black shadow-4"
            transition-show="scale"
            transition-hide="scale">
            <span class="text-capitalize">{{description}}</span>
          </q-tooltip>
        </q-icon>
        <div class="bkit-text">
          {{name}}
        </div>
      </div>
      <div class="column justify-around q-px-xs bkit-subcard">
        <q-btn flat no-caps stack
          color="positive"
          icon="publish"
          class="flip-vertical"
          v-if="isnew">
          <span class="flip-vertical text-weight-thin">Backup</span>
        </q-btn>
        <q-btn flat no-caps stack
          color="cyan"
          icon="call_merge"
          class="flip-vertical"
          v-if="wasmodified">
          <span class="flip-vertical text-weight-thin">Update</span>
        </q-btn>
        <q-btn flat no-caps stack
          color="orange"
          icon="publish"
          label="Restore"
          class="text-weight-thin"
          v-if="wasmodified"/>
        <q-btn flat no-caps stack
          color="positive"
          icon="publish"
          class="text-weight-thin"
          label="Restore"
          v-if="wasdeleted"/>
      </div>
    </div>
    <div v-if="hasbackup && !wasdeleted" class="row bkit-subcard text-weight-light no-wrap">
      <q-btn-dropdown no-caps flat no-wrap
        icon="assignment"
        color="green-4"
        label="Versions"
        class="text-weight-thin"
        :loading="loading"
        persistent
        strech
        dense
        @click="getVersions"
        >
        <q-list separator class="q-pa-xd" >
          <q-item dense
            clickable
            v-close-popup
            @click="onVersionClick"
            v-for="version in versions"
            :key="version.snap">
            <q-item-section>
              {{version.date}}
            </q-item-section>
            <q-item-section side>
              <q-icon color="positive" name="restore" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
    </div>
  </div>
</template>

<script>
import { getVersions } from 'src/helpers/bkit'
const path = require('path')

const moment = require('moment')
moment.locale('en')
const obooleans = {
  type: Boolean,
  require: false
}
const colorOf = {
  deleted: 'red',
  update: 'green',
  new: 'orange',
  modified: 'teal-3',
  filtered: 'grey-6',
  unchecked: 'grey-1',
  nobackup: 'amber'
}
const nameOf = {
  deleted: 'Was deleted',
  update: 'Is update',
  new: 'Not in backup',
  modified: 'Was modified',
  filtered: 'Is filtered',
  unchecked: 'Not checked yet! Wait...',
  nobackup: 'Disk has no backup'
}
export default {
  name: 'item',
  data () {
    return {
      versions: [],
      loading: false
    }
  },
  computed: {
    color () { return colorOf[this.status] },
    description () { return nameOf[this.status] },
    hasbackup () { return this.checked && this.onbackup },
    wasdeleted () { return this.checked && this.onbackup && !this.onlocal },
    isUpdate () { return this.checked && this.onbackup && this.onlocal && !this.wasmodified },
    unchecked () { return !this.checked },
    hasversions () { return this.versions.length > 0 },
    status () {
      if (this.unchecked) {
        return 'unchecked'
      } else if (this.isnew) {
        return 'new'
      } else if (this.wasmodified) {
        return 'modified'
      } else if (this.wasdeleted) {
        return 'deleted'
      } else if (this.isUpdate) {
        return 'update'
      } else if (this.isfiltered) {
        return 'filtered'
      } else if (this.nobackup) {
        return 'nobackup'
      }
      return null
    }
  },
  props: {
    isdir: obooleans,
    isfile: obooleans,
    onbackup: obooleans,
    onlocal: obooleans,
    checked: obooleans,
    wasmodified: obooleans,
    isnew: obooleans,
    isfiltered: obooleans,
    nobackup: obooleans,
    path: {
      type: String,
      require: true
    },
    name: {
      type: String,
      default: function () {
        return path.basename(this.path)
      }
    }
  },
  methods: {
    open () {
      console.log('open:', this.path)
      this.$emit('open', this.path)
    },
    onVersionClick (val) {
      console.log('Versions', val)
    },
    async getVersions () {
      const versions = []
      this.loading = true
      // bkit.bash('./versions.sh', [this.path], {
      try {
        const entries = await getVersions(this.path)
        // console.log('Versions:', entries)
        entries.forEach(e => versions.push(e))
      } catch (err) {
        console.error('Catch in getVersions', err)
      } finally {
        this.loading = false
        this.versions = versions
      }
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
  .bkit-card {
    min-width: $bkitsize;
    .bkit-text{
      max-width:$bkitsize;
      overflow-wrap: break-word;
      text-align:center
    }
    .bkit-icon{
      font-size: $biconsize;
    }
  }
</style>
