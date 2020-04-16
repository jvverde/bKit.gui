<template>
  <q-page padding class="relative">
    <jobs v-if="selected === 345"/>
    <tree
      :entry="{ isdir: true, isroot: true, path: disk.mountpoint }"
      v-for="disk in disks" :key="disk.id"
      :selected.sync="selected"/>
  </q-page>
</template>

<script>

import jobs from './components/Schtasks'
import tree from './components/Tree'
import { listLocalDisks } from 'src/helpers/bkit'

export default {
  name: 'TasksPage',
  data () {
    return {
      disks: [],
      root: { isdir: true, isroot: true, path: 'c:/' },
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
    async getLocalDisks () {
      const disks = await listLocalDisks() || []
      for (const disk of disks) {
        console.log('Local disk:', disk)
        const [mountpoint, label, uuid, fs] = disk.split(/\|/)
        this.disks.push({ mountpoint, label, uuid, fs, disk })
      }
    }
  },
  mounted () {
    this.getLocalDisks()
  }
}
</script>
