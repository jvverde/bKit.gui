<template>
  <div class="q-pa-xs bkit-item row">
    <div class="column no-wrap items-left">
      <q-icon v-if="isdir"
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
      <q-menu auto-close context-menu fit anchor="bottom start" self="top left" v-if="isdir">
        <q-list dense style="min-width: 100px">
          <q-item clickable v-close-popup @click="open">
            <q-item-section>Open</q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="backup" v-if="onlocal">
            <q-item-section>Backup</q-item-section>
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
    </div>
  </div>
</template>

<script>
// import { getVersions } from 'src/helpers/bkit'
import tooltip from 'src/components/tooltip'
import entry from 'src/mixins/entry'
import { mapMutations } from 'vuex'

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
    recover () {
      this.$emit('recover', this.path, this.isdir)
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
