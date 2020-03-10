<template>
  <q-card>
    <q-card-section horizontal>
      <q-card-section class="column no-wrap items-center">
        <!--div>
          [{{status}}]
        </div-->
        <q-icon
          v-if="isdir"
          class="bkit-icon"
          style="cursor:pointer"
          name="folder"
          @click="open"
          :color="colorosOf[status]">
          <q-tooltip anchor="top right" self="center middle"
            content-class="bg-amber text-black shadow-4"
            transition-show="scale"
            transition-hide="scale">
            <span class="text-capitalize">{{status}}</span>
          </q-tooltip>
        </q-icon>
        <q-icon
          v-else-if="isfile"
          class="bkit-icon"
          name="description"
          :color="colorosOf[status]">
          <q-tooltip anchor="top right" self="center middle"
            content-class="bg-amber text-black shadow-4"
            transition-show="scale"
            transition-hide="scale">
            <span class="text-capitalize">{{status}}</span>
          </q-tooltip>
        </q-icon>
        <q-icon
          v-else-if="wasdeleted"
          class="bkit-icon"
          name="fas fa-trash-restore"
          color="red-7">
          <q-tooltip anchor="top right" self="center middle"
            content-class="bg-amber text-black shadow-4"
            transition-show="scale"
            transition-hide="scale">
            <span class="text-capitalize">{{status}}</span>
          </q-tooltip>
        </q-icon>
        <div class="bkit-text">
          {{name}}
          <span v-if="wasdeleted && hasdescendants">
            [+{{descendants}}]
          </span>
        </div>
      </q-card-section>
      <q-card-actions vertical class="justify-around q-px-xs">
        <q-btn flat color="positive" icon="restore" no-caps stack label="Restore" v-if="wasdeleted"/>
        <q-btn flat color="positive" icon="backup" no-caps stack label="Backup" v-if="isnew"/>
        <q-btn flat color="positive" icon="backup" no-caps stack label="Backup" v-if="ismodified"/>
        <!--q-btn flat round color="cyan" icon="share" /-->
      </q-card-actions>
    </q-card-section>
    <q-card-section v-if="hasbackup">
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
import * as bkit from 'src/helpers/bkit'

const moment = require('moment')
moment.locale('en')

export default {
  name: 'item',
  data () {
    return {
      versions: [],
      loading: false,
      colorosOf: {
        deleted: 'red',
        onbackup: 'cyan',
        new: 'green',
        modified: 'amber',
        local: 'grey-4'
      }
    }
  },
  computed: {
    isdir () { return this.entry.isdir },
    isfile () { return this.entry.isfile },
    status () { return this.entry.status },
    hasbackup () { return this.status !== 'new' && this.status !== 'local' },
    name () { return this.entry.name },
    path () { return this.entry.path },
    descendants () { return this.entry.descendants },
    hasdescendants () { return 0 | this.descendants > 0 },
    wasdeleted () { return this.status === 'deleted' },
    ismodified () { return this.status === 'modified' },
    isnew () { return this.status === 'new' },
    hasversions () { return this.versions.length > 0 }
  },
  props: {
    entry: {
      type: Object,
      require: true
    }
  },
  methods: {
    open () {
      console.log('open:', this.entry.path)
      this.$emit('open', this.entry.path)
    },
    async getVersions () {
      console.log('getVersions')
      const versions = []
      this.loading = true
      bkit.bash('./versions.sh', [this.path], {
        onreadline: (data) => {
          console.log('Version:', data)
          const match = data.match(/(@GMT-.*?)\s+have a last modifed version at (\d{4}[/]\d\d[/]\d{2}-\d\d:\d\d:\d\d)/)
          const snap = match[1]
          const date = moment.utc(match[2], 'YYYY/MM/DD-HH:mm:ss').local().format('DD-MM-YYYY HH:mm')
          versions.push({ date, snap })
        },
        onclose: () => {
          this.$nextTick(() => {
            this.versions = versions
            this.loading = false
          })
        }
      })
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
