<template>
  <main class="relative full-width">
    <q-stepper v-model="step" vertical animated header-nav keep-alive
      done-icon="done" done-color="done" active-color="active"
      ref="stepper"
      class="row no-wrap justify-between b-stepper full-width">

       <q-step :name="1" title="Select" caption="Folders or Files" icon="receipt" :done="hasBackups">
        <div style="max-height:60vh;width:100%" class="scroll">
          <tree
            :entry="{ isdir: true, isroot: true, path: disk.mountpoint }"
            v-for="disk in disks" :key="disk.id"
            :selected.sync="selected"/>
        </div>
      </q-step>

      <q-step :name="2" title="Define" caption="When should run" icon="schedule" :done="hasScheduler">
        <schedule :scheduler.sync="scheduler"/>
        <span>Run every {{freq}} {{periodName}} at {{start}}</span>
      </q-step>

      <q-step :name="3" title="Name" caption="Identify the task" icon="how_to_reg" :done="hasName">
        <taskname :name.sync="taskname"/>
      </q-step>

      <q-step :name="4" title="Do It" caption="Create task" icon="paly_for_work" :done="isDone">
        <div class="column content-stretch">
          <create v-if="isReady" :taskname="taskname" :backups="backups" :includes="includes"
            :excludes="excludes" :scheduler="scheduler"
            @done="done"/>
          <div v-else class="column items-center">
            <div class="q-mt-lg">Not ready yet. Please very if all steps are done</div>
            <div class="q-ma-xs">{{whyNotReady}}</div>
          </div>
        </div>
      </q-step>

      <template v-slot:navigation>
        <q-stepper-navigation class="column no-wrap">

          <q-btn v-show="showBack" outline color="button" icon="keyboard_arrow_up"
            no-caps @click="back" label="Back" class="q-mx-sm q-mb-md"/>

          <resume :backups="backups" :includes="includes" :excludes="excludes" class="q-ma-md bg-lime-1"/>

          <q-btn v-if="!showFinish" flat color="cancel" @click="cancel" no-caps label="Cancel" class="q-ma-lg" style="margin-top: auto"/>

          <q-btn v-if="showNext" @click="next" icon-right="keyboard_arrow_down"
            no-caps outline color="button" label="Next" class="q-mx-sm q-my-xs"/>
          <q-btn v-else-if="showFinish" @click="finish"
            no-caps outline color="button" label="Finish" class="q-mx-sm q-my-xs" style="margin-top: auto"/>

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
import Scheduler from 'src/helpers/scheduler' // This is a Class
import resume from './Resume'
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
      result: null
    }
  },
  computed: {
    isDone () {
      return !!this.result
    },
    showBack () {
      return this.step > 1
    },
    showNext () {
      return this.step < 4
    },
    showFinish () {
      return this.step === 4 && this.isDone
    },
    freq () {
      return this.scheduler.freq
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
    includes () {
      return this.selected.filter(e => e.op === '+')
    },
    excludes () {
      return this.selected.filter(e => e.op === '-')
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
    }
  },
  components: {
    tree,
    taskname,
    schedule,
    create,
    resume
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
    },
    done (result) {
      this.result = result
    }
  },
  mounted () {
    this.getLocalDisks()
  }
}
</script>
<style type="text/scss">
  .b-stepper > :first-child {
    flex-grow: 1;
    max-width: 75%;
  }
  .b-stepper > :last-child {
    max-width: 25%;
    max-width: min(25%, 20em);
  }
</style>
