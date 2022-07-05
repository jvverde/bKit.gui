<!-- Show dir and files on rigth sie panel -->
<template>
  <div class="fit">
    <q-inner-loading :showing="!done">
      <q-spinner-ios size="100px" color="loader"/>
    </q-inner-loading>
    <div class="bkit-showdir full-width row wrap justify-left">
      <item v-for="children in childrens" :key="children.name" :entry="children"/>
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

<style lang="scss">
</style>
