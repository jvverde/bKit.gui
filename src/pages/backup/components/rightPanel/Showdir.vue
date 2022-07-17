<!-- Show dir and files on rigth sie panel -->
<template>
  <div class="fit column no-wrap">
    <div class="full-width row no-wrap justify-left bg-grey-3">
      <q-btn color="path" flat size="md" icon="navigate_before" @click="goBack" :disable="!canGoBack"/>
      <q-btn color="path" flat size="md" icon="navigate_next" @click="goForward" :disable="!canGoForward"/>
      <q-btn color="path" flat size="md" icon="arrow_upward" @click="goUp"/>
      <div style="margin-left:auto"/>
      <q-btn round color="warning" flat size="sm" icon="do_not_disturb_on" @click="ban"/>
    </div>
    <q-scroll-area class="fit" :thumb-style="thumbStyle" :bar-style="barStyle">
      <div class="full-width row wrap justify-left">
        <item v-for="children in childrens" :key="children.name" :entry="children"/>
      </div>
    </q-scroll-area>
    <div v-show="!done" class="loader">
      <q-spinner-ios size="100px" color="loader"/>
    </div>
  </div>
</template>
<script>

import compare from 'src/helpers/compare'
import { writeFile } from 'src/helpers/writefs'
import dir from 'src/mixins/directory'
import sstyle from 'src/mixins/scrollStyle'
import { mapGetters, mapMutations } from 'vuex'

export default {
  name: 'show-content',
  mixins: [dir, sstyle],
  components: {
    item: () => import('./Item')
  },
  computed: {
    ...mapGetters('backups', ['empty']),
    ...mapGetters('view', ['canGoBack', 'canGoForward']),
    childrens () {
      return [...this.entries].sort(compare)
    }
  },
  methods: {
    ...mapMutations('backups', ['show', 'hide', 'toggle']),
    ...mapMutations('view', ['goUp', 'goBack', 'goForward']),
    ban () {
      console.log('Ban', this.fullpath)
      writeFile(`${this.fullpath}/.rsync-filter`, '+ .rsync-filter\nH /*\nP /*')
    }
  },
  beforeDestroy () {
    // console.log('Destroy ShowDir')
  }
}
</script>

<style lang="scss" scoped>
  .loader {
    position: fixed;
    right: 50%;
    right: calc(50% - 100px / 2);
    top: 35vh;
    z-index:2
  }
</style>
