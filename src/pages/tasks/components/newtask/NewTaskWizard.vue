<template>
  <main class="relative fit">
    <q-stepper v-model="step" vertical animated header-nav keep-alive
      done-icon="done" done-color="done" active-color="active"
      ref="stepper"
      class="row no-wrap justify-between b-stepper">

       <q-step :name="1" title="Select" caption="Folders or Files" icon="receipt" :done="hasBackups">
        <div style="max-height:50vh;width:100%" class="scroll">
          <tree
            :entry="{ isdir: true, isroot: true, path: disk.mountpoint }"
            v-for="disk in disks" :key="disk.id"
            :selected.sync="selected"/>
        </div>
      </q-step>

      <q-step :name="2" title="Define" caption="When should run" icon="schedule" :done="hasScheduler">
        <schedule :scheduler.sync="scheduler"/>
        <span>Run every {{freq}} {{periodName}}</span>
      </q-step>

      <q-step :name="3" title="Name" caption="Identify the task" icon="how_to_reg" :done="hasName">
        <taskname :name.sync="taskname"/>
      </q-step>

      <q-step :name="4" title="Do It" caption="Create task" icon="paly_for_work" :done="isDone">
        <div class="column content-stretch">
          <create v-if="isReady" :backups="backups" :includes="includes"
            :excludes="excludes" :scheduler="scheduler"/>
          <div v-else class="column items-center">
            <div class="q-mt-lg">Not ready yet. Please very if all steps are done</div>
            <div class="q-ma-xs">{{whyNotReady}}</div>
          </div>
        </div>
      </q-step>

      <template v-slot:navigation>
        <q-stepper-navigation class="column no-wrap">
          <q-btn :disable="!showBack" :flat="!showBack" :outline="showBack" color="button" icon="keyboard_arrow_up"
            no-caps @click="back" label="Back" class="q-mx-sm"/>
          <q-btn v-if="showNext" @click="next" icon-right="keyboard_arrow_down"
            no-caps outline color="button" label="Next" class="q-mx-sm q-my-xs"/>
          <q-btn v-else-if="showLast" :disable="!isDone" @click="finish"
            no-caps outline color="button" label="Finish" class="q-mx-sm q-my-xs"/>
          <div class="q-ma-md bg-lime-1" style="margin: auto 0">
            <q-bar dense v-if="hasBackups">Backup</q-bar>
            <q-chip dense color="included" outline :label="b"
              size="sm"
              v-for="(b, i) in backups" :key="'b' + i"/>
            <q-bar dense v-if="hasExcludes">Excluding</q-bar>
            <q-chip dense color="excluded" outline :label="e.path"
              size="sm"
              v-for="e in excludes" :key="'e' + e.path"/>
            <q-bar dense v-if="hasNeeds2include">Including</q-bar>
            <q-chip dense color="included" outline :label="n.path"
              size="sm"
              v-for="n in needs2include" :key="'n' + n.path"/>
          </div>
          <q-btn flat color="cancel" @click="cancel" no-caps label="Cancel" class="q-ma-sm" style="margin-top: auto"/>
        </q-stepper-navigation>
      </template>
    </q-stepper>
  </main>
</template>

<script>

import tree from './steps/Tree'
import taskname from './steps/Taskname'
import schedule from './steps/Schedule'
import create from './steps/Create'
import Scheduler from 'src/helpers/scheduler'
import { listLocalDisks } from 'src/helpers/bkit'
const { sep: SEP } = require('path')

const compare = (a, b) => {
  if (a.toLowerCase() < b.toLowerCase()) return -1
  if (a.toLowerCase() > b.toLowerCase()) return 1
  return 0
}

export default {
  name: 'newtask',
  data () {
    return {
      askuser: false,
      disks: [],
      selected: [],
      step: 1,
      scheduler: new Scheduler(),
      taskname: undefined,
      isDone: false
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
    freq () {
      return this.scheduler.freq
    },
    period () {
      return this.scheduler.value()
    },
    periodName () {
      return this.scheduler.label()
    },
    start () {
      return this.scheduler.start
    },
    hasScheduler () {
      return this.scheduler.isComplete()
    },
    hasName () {
      return !!this.taskname
    },
    backups () {
      const paths = this.includes.map(e => e.path).sort(compare)
      const reducer = (acc, v) => {
        if (acc.some(e => v.startsWith(`${e}${SEP}`))) return acc
        else return [...acc, v]
      }
      return paths.reduce(reducer, [])
    },
    hasBackups () {
      return this.backups.length > 0
    },
    isReady () {
      return this.hasBackups && this.hasScheduler && this.hasName
    },
    whyNotReady () {
      if (this.isReady) return ''
      else if (!this.hasBackups) return 'You need to select what to backup in step 1'
      else if (!this.hasScheduler) return 'You need to create a scheduler in step 2'
      else if (!this.hasName) return 'You need to define a name in step 3'
      else return 'You shoudn\'t be here'
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
    }
  },
  components: {
    tree,
    taskname,
    schedule,
    create
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
    max-width: min(40%, 20em);
    max-width: 25em;
  }
</style>
