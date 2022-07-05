<!-- Show dir and files on rigth sie panel -->
<template>
  <div class="bkit-showdir full-width row wrap justify-left">
    <item v-for="children in childrens" :key="children.name" :entry="children"/>
    <div v-show="!done" class="loader">
      <q-spinner-ios size="100px" color="loader"/>
    </div>
  </div>
</template>
<script>

import compare from 'src/helpers/compare'
import dir from 'src/mixins/directory'

export default {
  name: 'show-content',
  mixins: [dir],
  components: {
    item: () => import('./Item')
  },
  computed: {
    childrens () {
      return [...this.entries].sort(compare)
    }
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
