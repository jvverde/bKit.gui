<template>
  <div class="bkit-explorer relative-position">
    <q-toolbar class="bkit-toolbar justify-center" v-if="rvid">
      <keep-alive>
        <snaps :rvid="rvid" :snap.sync="snap" ref="snaps"></snaps>
      </keep-alive>
    </q-toolbar>
    <q-toolbar inset v-if="isReady2Show">
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
    <q-splitter
      v-if="isReady2Show"
      class="bkit-splitter"
      :limits="[0, 80]"
      v-model="verticalSplitter">

      <template v-slot:before>
        <q-scroll-area class="fit" :thumb-style="thumbStyle" :bar-style="barStyle">
          <listdir :fullpath="mountpoint" :snap="snap" :rvid="rvid" :mountpoint="mountpoint" style="padding-right: 8px"/>
        </q-scroll-area>
      </template>

      <template v-slot:after>
        <q-scroll-area class="fit" :thumb-style="thumbStyle" :bar-style="barStyle">
          <div class="q-pa-xs row justify-evenly q-gutter-sm relative-position">
            <showdir :fullpath="currentpath" :snap="snap" :rvid="rvid" :mountpoint="mountpoint" style="padding-right: 8px"/>
          </div>
        </q-scroll-area>
      </template>
    </q-splitter>
  </div>
</template>
<script>

import { relative, join, sep } from 'path'
import { mapGetters, mapMutations } from 'vuex'

import snaps from './Snaps'
import listdir from './Listdir'
import showdir from './Showdir'

const thumbStyle = {
  right: '4px',
  borderRadius: '5px',
  backgroundColor: '#67A9FB',
  width: '5px',
  opacity: 0.75
}

const barStyle = {
  right: '2px',
  borderRadius: '9px',
  backgroundColor: '#67A9FB',
  width: '9px',
  opacity: 0.2
}
export default {
  name: 'localexplorer',
  data () {
    return {
      verticalSplitter: 25,
      thumbStyle,
      barStyle,
      snap: undefined,
      sep
    }
  },
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
    // tree,
    // item
  },
  computed: {
    ...mapGetters('view', ['getview']),
    currentpath () {
      return this.getview || this.mountpoint
    },
    drive () {
      return this.mountpoint.replace(/[\\/]+$/, '')
    },
    steps () {
      const rel = relative(this.mountpoint, this.currentpath)
      return this.currentpath !== '' ? `${rel}`.split(sep) : []
    },
    isReady2Show () {
      return this.snap !== undefined || !this.rvid
    }
  },
  watch: {
  },
  mounted () {
  },
  methods: {
    ...mapMutations('view', ['setView']),
    stepto (index) {
      const fullpath = join(this.mountpoint, this.steps.slice(0, index).join('/'))
      console.log('Go to', fullpath)
      this.setView(fullpath)
    }
  }
}

</script>

<style scoped lang="scss">
  $bkitsize: 6em;
  .bkit-explorer {
    height:100%;
    display: flex;
    flex-direction: column;
    overflow-y:hidden;
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
