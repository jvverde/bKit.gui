<template>
  <div class="bkit-explorer fit column">

    <q-toolbar class="bkit-toolbar justify-center" v-if="rvid">
      <keep-alive>
        <snaps :rvid="rvid"/>
      </keep-alive>
    </q-toolbar>

    <q-toolbar inset>
      <q-breadcrumbs gutter="xs" active-color="path" separator-color="path-sep" :separator="sep">
        <q-breadcrumbs-el
          v-if="steps.length > 0"
          style="cursor:pointer"
          @click="stepto(0)"
          :label="drive"
          icon="far fa-hdd"/>
        <q-breadcrumbs-el
          style="cursor:pointer"
          v-for="(step, index) in steps" :key="index"
          @click="stepto(1 + index)"
          :label="step"/>
      </q-breadcrumbs>
    </q-toolbar>

    <q-splitter class="bkit-splitter overflow-hidden" :limits="[10, 80]" v-model="verticalSplitter">

      <template v-slot:before>
        <q-scroll-area class="fit" :thumb-style="thumbStyle" :bar-style="barStyle">
          <listdir :fullpath="mountpoint" :snap="snap" :rvid="rvid" :mountpoint="mountpoint" style="padding-right: 8px"/>
        </q-scroll-area>
      </template>

      <template v-slot:after>
        <showdir :fullpath="currentpath" :snap="snap" :rvid="rvid" :mountpoint="mountpoint" style="padding-right: 8px"/>
      </template>

    </q-splitter>
  </div>
</template>
<script>

import { relative, join, sep } from 'path'
import { mapGetters, mapMutations, mapActions } from 'vuex'

import snaps from './Snaps'
import listdir from './leftPanel/Listdir'
import showdir from './rightPanel/Showdir'
import sstyle from 'src/mixins/scrollStyle'

const lastPaths = {}

export default {
  name: 'localexplorer',
  data () {
    return {
      verticalSplitter: 25,
      sep
    }
  },
  mixins: [sstyle],
  props: {
    mountpoint: {
      type: String,
      default: ''
    },
    rvid: {
      type: String,
      default: undefined
    }
  },
  components: {
    listdir,
    showdir,
    snaps
  },
  computed: {
    ...mapGetters('view', ['getview']),
    ...mapGetters('snaps', ['getCurrentSnap']),
    ...mapGetters('backups', ['getLastCompleted']),
    snap () { return (this.getCurrentSnap || {}).snap },
    currentpath () {
      return this.getview.path || this.mountpoint
    },
    drive () {
      return this.mountpoint.replace(/[\\/]+$/, '')
    },
    base () {
      return this.mountpoint || sep
    },
    steps () {
      const rel = relative(this.base, this.currentpath)
      return this.currentpath !== '' ? `${rel}`.split(sep) : []
    },
    volume () {
      return `${this.rvid || '_'}-${this.mountpoint || '_'}`
    }
  },
  watch: {
    getview (view, old) {
      if (view && old && view.mountpoint === old.mountpoint) {
        // Save last path in order go directly next time we change back from another disk
        const { rvid, mountpoint, path } = view
        lastPaths[this.volume] = { rvid, mountpoint, path }
      }
    },
    getLastCompleted (val) {
      if (val && val.path && this.mountpoint && val.path.startsWith(this.mountpoint)) {
        this.loadSnaps(this.rvid)
      }
    }
  },
  mounted () {
    console.log('Mount Exlorer')
    const currentView = this.getview
    const { mountpoint, rvid, snap } = this
    console.log('currentView', currentView)
    console.log('mountpoint, rvid, snap', mountpoint, rvid, snap)
    if (rvid !== currentView.rvid || mountpoint !== currentView.mountpoint) {
      // Only set a new view if current view isn't already on this disk (same rvid and same mountpoint)
      // This is usefull when we change back from another disk or the first time we enter in this disk
      const path = (lastPaths[this.volume] || {}).path || this.mountpoint || sep
      console.log('SetView to', mountpoint, rvid, path, snap)
      this.setView({ mountpoint, rvid, path, snap })
    }
  },
  methods: {
    ...mapActions('snaps', ['loadSnaps']),
    ...mapMutations('view', ['setView']),
    stepto (index) {
      const path = join(this.base, this.steps.slice(0, index).join('/'))
      const { rvid, mountpoint, snap } = this
      this.setView({ path, rvid, mountpoint, snap })
    }
  },
  beforeDestroy () {
    // console.log('Destroy explorer')
  }
}

</script>

<style scoped lang="scss">
  $bkitsize: 6em;
  .bkit-explorer {
    .bkit-toolbar {
      flex-shrink:0 ;
    }
    .bkit-splitter {
      flex-shrink: 1;
      flex-grow: 1;
      overflow-y: hidden;
    }
  }
</style>

<style lang="scss">
  .bkit-loading {
    height: 3em;
  }
  .loading-leave-active {
    transition: margin-top .6s ease-in-out;
    opacity: 0;
  }
  .loading-leave-to {
    margin-top: -3em;
  }
</style>
