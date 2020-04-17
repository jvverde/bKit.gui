<template>
  <main class="relative scroll">
    <q-stepper
      class="row no-wrap justify-between b-stepper"
      v-model="step"
      vertical
      color="primary"
      keep-alive
      ref="stepper"
      animated>
      <q-step
        :name="1"
        title="Select"
        caption="Folders or Files"
        icon="settings"
        :done="step > 1"
      >
        <tree
          :entry="{ isdir: true, isroot: true, path: disk.mountpoint }"
          v-for="disk in disks" :key="disk.id"
          :selected.sync="selected"/>
      </q-step>
      <q-step
        :name="2"
        title="Define"
        caption="When task should run"
        icon="assignment"
        :done="step > 2"
      >
        <div class="column no-wrap items-center">
          <div class="q-gutter-sm row items-center">
            <span>Every</span>
            <q-input
              v-model.number="freq"
              maxlength="2"
              outlined
              dense
              style="max-width:5em"
              type="number"/>
            <q-radio v-model="every" val="-m" label="Minute" />
            <q-radio v-model="every" val="-h" label="Hour" />
            <q-radio v-model="every" val="-d" label="Day" />
            <q-radio v-model="every" val="-w" label="Week" />
          </div>
          <div class="q-gutter-sm row items-center">
            <span>Start at</span>
            <q-input v-model="start" dense outlined type="time"/>
          </div>
        </div>
      </q-step>
      <template v-slot:navigation>
        <q-stepper-navigation class="column no-wrap">
          <q-btn @click="$refs.stepper.next()" color="primary" :label="step === 3 ? 'Create Task' : 'Continue'" />
          <q-btn v-if="step > 1" flat color="primary" @click="$refs.stepper.previous()" label="Back" class="q-ml-sm" />
        </q-stepper-navigation>
      </template>
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
      selected: undefined,
      freq: 1,
      every: '-d',
      start: undefined
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
<style type="text/scss">
  .b-stepper > :first-child {
    flex-grow:1
  }
</style>
