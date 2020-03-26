<template>
  <q-card>
    <q-card-section horizontal>
      <q-card-section class="column no-wrap items-center">
        <q-icon
          v-if="isdir"
          class="bkit-icon"
          style="cursor:pointer"
          name="folder"
          @click="open"
          :color="color">
          <q-tooltip anchor="top right" self="center middle"
            content-class="bg-grey-1 text-black shadow-4"
            transition-show="scale"
            transition-hide="scale">
            <span class="text-capitalize">{{description}}</span>
          </q-tooltip>
        </q-icon>
        <q-icon
          v-else-if="isfile"
          class="bkit-icon"
          name="description"
          :color="color">
          <q-tooltip anchor="top right" self="center middle"
            content-class="bg-grey-1 text-black shadow-4"
            transition-show="scale"
            transition-hide="scale">
            <span class="text-capitalize">{{description}}</span>
          </q-tooltip>
        </q-icon>
        <q-icon
          v-else-if="wasdeleted"
          class="bkit-icon"
          name="restore_from_trash"
          color="red-7">
          <q-tooltip anchor="top right" self="center middle"
            content-class="bg-grey-1 text-black shadow-4"
            transition-show="scale"
            transition-hide="scale">
            <span class="text-capitalize">{{description}}</span>
          </q-tooltip>
        </q-icon>
        <div class="bkit-text">
          {{name}}
        </div>
      </q-card-section>
      <q-card-actions vertical class="justify-around q-px-xs">
        <q-btn flat color="positive" icon="restore" no-caps stack label="Restore" v-if="wasdeleted"/>
        <q-btn flat color="positive" icon="backup" no-caps stack label="Backup" v-if="isnew"/>
        <q-btn flat color="positive" icon="backup" no-caps stack label="Backup" v-if="wasmodified"/>
        <!--q-btn flat round color="cyan" icon="share" /-->
      </q-card-actions>
    </q-card-section>
    <q-card-section v-if="hasbackup && !wasdeleted">
      <q-btn flat color="green-4" icon="assignment" no-caps label="Versions" @click="getVersions"/>
      <q-list separator class="q-pa-xd">
        <q-item dense v-for="version in versions" :key="version.snap">
          <q-item-section>
            {{version.date}}
          </q-item-section>
          <q-item-section side>
            <q-icon color="positive" name="restore" />
          </q-item-section>
        </q-item>
      </q-list>
      <q-inner-loading :showing="loading">
        <q-spinner-ios color="amber"/>
      </q-inner-loading>
    </q-card-section>
  </q-card>
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
  unchecked: 'grey-1'
}
const nameOf = {
  deleted: 'Was deleted',
  update: 'Is update',
  new: 'Not in backup',
  modified: 'Was modified',
  filtered: 'Is filtered',
  unchecked: 'Not checked yet! Wait...'
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
    async getVersions () {
      const versions = []
      this.loading = true
      // bkit.bash('./versions.sh', [this.path], {
      try {
        const entries = await getVersions(this.path)
        console.log('Versions:', entries)
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
  $bkitsize: 6em;
  .bkit-text{
    max-width:$bkitsize;
    overflow-wrap: break-word;
    text-align:center
  }
  .bkit-icon{
    font-size:$bkitsize;
  }
</style>
