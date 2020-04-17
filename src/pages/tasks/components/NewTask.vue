<template>
  <main class="relative scroll">
    <q-stepper
      class="row no-wrap justify-between b-stepper"
      v-model="step"
      vertical
      color="positive"
      keep-alive
      ref="stepper"
      animated>
      <q-step
        :name="1"
        title="Select"
        caption="Folders or Files"
        icon="receipt"
        :done="step > 1"
      >
        <div>Selected:{{selected}}</div>
        <tree
          :entry="{ isdir: true, isroot: true, path: disk.mountpoint }"
          v-for="disk in disks" :key="disk.id"
          :selected.sync="selected"/>
      </q-step>
      <q-step
        :name="2"
        title="Define"
        caption="When task should run"
        icon="schedule"
        :done="step > 2"
      >
        <div class="column no-wrap items-center">
          <div class="q-gutter-sm row items-center">
            <q-input
              v-model.number="freq"
              maxlength="2"
              outlined
              dense
              label="Every"
              style="max-width:5em"
              type="number"/>
            <q-radio v-model="every" val="-m" label="Minute(s)" />
            <q-radio v-model="every" val="-h" label="Hour(s)" />
            <q-radio v-model="every" val="-d" label="Day(s)" />
            <q-radio v-model="every" val="-w" label="Week(s)" />
          </div>
          <div class="q-gutter-sm row items-center">
            <span>Start at</span>
            <q-input v-model="start" dense outlined type="time"/>
          </div>
        </div>
      </q-step>
      <q-step
        :name="3"
        title="Name"
        caption="Identify the task"
        icon="how_to_reg"
        :done="step > 3"
      >
        <div class="column no-wrap items-center">
          <q-input
            v-model="taskname"
            prefix="BKIT-"
            outlined
            dense
            label="Taskname"
            hint="Choose a name not yet listed"
            type="text"/>
        </div>
      </q-step>
      <q-step
        :name="4"
        title="Do It"
        caption="Create task"
        icon="paly_for_work"
        :done="step > 3"
      >
        <div class="column content-stretch">
          <q-btn icon-right="subdirectory_arrow_left" rounded push outline
            size="md" color="positive"
            class="q-ma-sm"
            label="Enter"/>
        </div>
      </q-step>
      <template v-slot:navigation>
        <q-stepper-navigation class="column no-wrap">
          <q-btn v-if="showNext" @click="next" no-caps outline color="positive" label="Next" />
          <q-btn v-else-if="showLast" @click="finish" no-caps outline color="positive" label="Finish" />
          <q-btn v-if="showBack" flat color="positive" no-caps @click="back" label="Back" class="q-ma-sm" />
          <q-btn flat color="warning" @click="cancel" no-caps label="Cancel" class="q-ma-sm" style="margin-top: auto"/>
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
      start: undefined,
      taskname: undefined
    }
  },
  computed: {
    showBack () {
      return this.step > 1
    },
    showNext () {
      return this.step < 4
    },
    showLast () {
      return this.step === 4
    },
    canIgo () {
      return true
    }
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
    },
    finish () {
      this.$emit('finish')
    },
    next () {
      this.$refs.stepper.next()
    },
    back () {
      this.$refs.stepper.previous()
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
