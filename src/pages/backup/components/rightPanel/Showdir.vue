<!-- Show dir and files on rigth sie panel -->
<template>
  <div class="bkit-showdir full-width row wrap justify-left">
    <div class="full-width row no-wrap justify-left">
      <q-btn color="button" flat size="md" icon="navigate_before" @click="goBack" :disable="!canGoBack"/>
      <q-btn color="button" flat size="md" icon="navigate_next" @click="goForward" :disable="!canGoForward"/>
      <q-btn color="button" flat size="md" icon="arrow_upward" @click="goUp"/>
      <q-btn v-show="!empty" round color="button" flat size="sm" icon="backup" @click="toggle"/>
    </div>
    <item v-for="children in childrens" :key="children.name" :entry="children"/>
    <div v-show="!done" class="loader">
      <q-spinner-ios size="100px" color="loader"/>
    </div>
  </div>
</template>
<script>

import compare from 'src/helpers/compare'
import dir from 'src/mixins/directory'
import { mapGetters, mapMutations } from 'vuex'

export default {
  name: 'show-content',
  mixins: [dir],
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
    ...mapMutations('view', ['goUp', 'goBack', 'goForward'])
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
