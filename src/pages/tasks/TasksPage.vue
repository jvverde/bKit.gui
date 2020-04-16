<template>
  <q-page padding class="relative">
    <jobs v-if="selected === 345"/>
    <tree
      :entry="{ isdir: true, isroot: true, path: '/' }"
      mountpoint="C:"
      :selected.sync="selected"/>
  </q-page>
</template>

<script>

import jobs from './components/Schtasks'
import tree from './components/Tree'

export default {
  name: 'TasksPage',
  data () {
    return {
      selected: undefined
    }
  },
  computed: {
  },
  components: {
    jobs,
    tree
  },
  watch: {
  },
  methods: {
  },
  mounted () {
  }
}
</script>
