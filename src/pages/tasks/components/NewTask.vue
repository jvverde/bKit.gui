<template>
  <main class="relative scroll">
    <q-stepper
      class="row no-wrap justify-between b-stepper"
      v-model="step"
      vertical
      color="secondary"
      header-nav
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
          <div class="q-gutter-sm row items-center no-wrap">
            <q-input
              v-model.number="freq"
              maxlength="2"
              outlined
              dense
              label="Every"
              style="max-width:7em;min-width:5em"
              type="number"/>
            <q-radio v-model="every" val="-m" label="Minute(s)" />
            <q-radio v-model="every" val="-h" label="Hour(s)" />
            <q-radio v-model="every" val="-d" label="Day(s)" />
            <q-radio v-model="every" val="-w" label="Week(s)" />
          </div>
          <div class="q-gutter-sm row items-center no-wrap">
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
          <div class="q-ma-md">
            <q-bar dense v-if="hasBackups">Backup</q-bar>
            <q-chip dense color="green" outline :label="b"
              size="sm"
              v-for="(b, i) in backups" :key="'b' + i"/>
            <q-bar dense v-if="hasExcludes">Excluding</q-bar>
            <q-chip dense color="red" outline :label="e.path"
              size="sm"
              v-for="e in excludes" :key="'e' + e.path"/>
            <q-bar dense v-if="hasNeeds2include">Including</q-bar>
            <q-chip dense color="green" outline :label="n.path"
              size="sm"
              v-for="n in needs2include" :key="'n' + n.path"/>
          </div>
          <div v-for="(filter, index) in filters" :key="index">
            <!-- {{index}}: {{filter}} -->
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
const { sep: _SEP } = require('path')

const compare = (a, b) => {
  if (a.toLowerCase() < b.toLowerCase()) return -1
  if (a.toLowerCase() > b.toLowerCase()) return 1
  return 0
}
const compareReverse = (a, b) => compare(b, a)
const bypath = (a, b) => compareReverse(a.path, b.path)

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
    backups () {
      const paths = this.includes.map(e => e.path).sort(compare)
      const reducer = (acc, v) => {
        if (acc.some(e => v.startsWith(`${e}${_SEP}`))) return acc
        else return [...acc, v]
      }
      return paths.reduce(reducer, [])
    },
    hasBackups () {
      return this.backups.length > 0
    },
    includes () {
      return this.selected.filter(e => e.op === '+')
    },
    hasIncludes () {
      return this.includes.length > 0
    },
    excludes () {
      return this.selected.filter(e => e.op === '-')
    },
    hasExcludes () {
      return this.excludes.length > 0
    },
    needs2include () { // Needs2include = Includes - Backups
      return this.includes.filter(e => !this.backups.includes(e.path))
    },
    hasNeeds2include () {
      return this.needs2include.length > 0
    },
    ancestors () {
      const reducer = (a, v) => [...a, [a.pop(), v].join(_SEP)]

      const parents = this.includes.flatMap(file => {
        const steps = file.path.split(_SEP)
        const root = steps.shift()
        return steps.reduce(reducer, [root]) // parents-or-self
      })

      return [...new Set(parents)].map(path => `+/ ${path}`).sort(compareReverse)
    },
    filters () {
      const { includes, excludes, ancestors } = this

      const filters = [...includes, ...excludes].sort(bypath)
        .map(e => {
          if (e.op === '+') {
            if (e.isdir) return '+/ ' + [e.path, '**'].join(_SEP)
            // else return '+/ ' + e.path #there is no need to include file itsel
          } else {
            if (e.isdir) return '-/ ' + [e.path, '**'].join(_SEP)
            else return '-/ ' + e.path
          }
          return undefined
        }).filter(e => e)

      return [...ancestors, ...filters]
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
        const [letter, label, uuid, fs] = disk.split(/\|/)
        const mountpoint = letter.replace(/\\$/, '')
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
    flex-grow: 1
  }
  .b-stepper > :last-child {
    max-width: 40%;
  }
</style>
