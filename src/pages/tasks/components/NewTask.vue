<template>
  <main class="relative scroll">
    <q-stepper
      v-model="step"
      vertical
      color="primary"
      keep-alive
      animated>
      <q-step
        :name="1"
        title="Select"
        caption="Folders or Files"
        icon="settings"
        :done="step > 1"
      >
        <div class="row no-wrap justify-between">
          <div>
            <tree
              :entry="{ isdir: true, isroot: true, path: disk.mountpoint }"
              v-for="disk in disks" :key="disk.id"
              :selected.sync="selected"/>
          </div>
          <q-stepper-navigation class="column no-wrap align-center">
            <q-btn @click="step = 2" color="positive" label="Continue" />
            <q-btn @click="cancel" color="negative" label="Cancel" />
          </q-stepper-navigation>
        </div>
      </q-step>
      <q-step
        :name="2"
        title="Define"
        caption="When task should run"
        icon="assignment"
        :done="step > 2"
      >
        <q-stepper-navigation>
          <q-btn @click="step = 4" color="primary" label="Continue" />
          <q-btn flat @click="step = 1" color="primary" label="Back" class="q-ml-sm" />
        </q-stepper-navigation>
        An ad group contains one or more ads which target a shared set of keywords.
      </q-step>
    </q-stepper>
  </main>
</template>

<script>

import tree from './Tree'
import { listLocalDisks } from 'src/helpers/bkit'

export default {
  name: 'newtask',
  data () {
    return {
      disks: [],
      step: 1,
      selected: undefined
    }
  },
  computed: {
  },
  components: {
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
    },
    cancel () {
      this.$emit('cancel')
    }
  },
  mounted () {
    this.getLocalDisks()
  }
}
</script>
