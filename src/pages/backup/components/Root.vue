<template>
  <q-list>
    <div>mountpoint: {{ mountpoint }}</div>
    <div>rvid {{ rvid }}</div>
    <div>snap {{ snap }}</div>
    <div>fullpath {{ fullpath }}</div>
    <div>names: {{ names.map(e => [e.name, e.onlocal, e.onbackup]) }}</div>
  <!--     <tree
      :entry="root"
      :mountpoint="mountpoint"
      :rvid="rvid"
      :snap="snap"
      :displayNode.sync="currentPath"
      :selected.sync="selectedNode"
      @restore="(...args) => $emit('restore', ...args)"
      @backup="(...args) => $emit('backup', ...args)"
      @show="show"/> -->
  </q-list>
</template>

<script>

import directory from 'src/mixins/directory'
// import tree from './Tree'

export default {
  name: 'root',
  data () {
    return {
    }
  },
  props: {
  },
  // components: { tree },
  mixins: [directory],
  computed: {
    names () {
      return this.entries
    }
  },
  watch: {
  },
  methods: {
  },
  mounted () {
  }
}
</script>

<style lang="scss">
</style>
