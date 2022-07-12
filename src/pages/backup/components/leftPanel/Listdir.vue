<!-- Show dir and files on left sie panel -->
<template>
  <div class="full-width">
    <div class="full-width">
      <dir v-for="folder in folders" :key="folder.path" :entry="folder"/>
    </div>
    <div class="full-width">
      <file v-for="file in files" :key="file.path" :entry="file"/>
    </div>
  </div>
</template>
<script>

import compare from 'src/helpers/compare'
import directory from 'src/mixins/directory'

export default {
  name: 'Entries',
  mixins: [directory],
  components: {
    dir: () => import('./DirEntry'), /* Dir.vue also dynamically import this moddule */
    file: () => import('./FileEntry')
  },
  computed: {
    childrens () {
      return [...this.entries].sort(compare)
    },
    folders () {
      return this.childrens.filter(e => e.isdir)
    },
    files () {
      return this.childrens.filter(e => !e.isdir)
    }
  },
  beforeDestroy () {
    // console.log('Destroy ListDir')
  }

}
</script>

<style lang="scss">
</style>
