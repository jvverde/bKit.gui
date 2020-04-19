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
          <div v-for="(filter, index) in filters" :key="index">
            {{index}}: {{filter}}
          </div>
          <q-btn flat color="warning" @click="cancel" no-caps label="Cancel" class="q-ma-sm" style="margin-top: auto"/>
        </q-stepper-navigation>
      </template>
    </q-stepper>
  </main>
</template>

<script>

import tree from './Tree'
import { listLocalDisks } from 'src/helpers/bkit'
const path = require('path')

// const byop = (a, b) => {
//   if (a.op === b.op) return bypath(a, b)
//   else if (!a.op) return -1 // no op, means ancestor and as so should be the first
//   else if (!b.op) return 1
//   else return bypath(a, b)
// }
const compare = (a, b) => {
  if (a.toLowerCase() < b.toLowerCase()) return 1
  if (a.toLowerCase() > b.toLowerCase()) return -1
  return 0
}
const bypath = (a, b) => compare(a.path, b.path)

export default {
  name: 'newtask',
  data () {
    return {
      disks: [],
      selected: [],
      step: 1,
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
    },
    filters () {
      const selected = this.selected
      const includes = selected.filter(e => e.op === '+')
      const excludes = selected.filter(e => e.op === '-')
      const reducer = (a, v) => [...a, [a.pop(), v].join(path.sep)]
      const parents = includes.flatMap(file => {
        const steps = file.path.split(path.sep)
        steps.splice(-1) // Remove basename. I just want parents
        const root = steps.shift()
        return steps.reduce(reducer, [root])
      })
      const ancestores = [...new Set(parents)].map(path => '+/ ' + path).sort(compare)

      const filters = [...includes, ...excludes].sort(bypath)
        .map(e => {
          if (e.op === '+') {
            if (e.isdir) return '+/ ' + [e.path, '**'].join(path.sep)
            else return '+/ ' + e.path
          } else {
            if (e.isdir) return '-/ ' + [e.path, '**'].join(path.sep)
            else return '-/ ' + e.path
          }
        })
      return [...ancestores, ...filters]
    }
  },
  components: {
    tree
  },
  watch: {
    selected (val) {
    }
  },
  methods: {
    async getLocalDisks () {
      const disks = await listLocalDisks() || []
      for (const disk of disks) {
        console.log('Local disk:', disk)
        const [mountpoint, label, uuid, fs] = disk.split(/\|/)
        this.disks.push({ mountpoint, label, uuid, fs, disk, selected: [] })
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
