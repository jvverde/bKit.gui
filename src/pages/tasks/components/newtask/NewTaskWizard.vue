<template>
  <main class="relative fit">
    <q-stepper
      class="row no-wrap justify-between b-stepper"
      v-model="step"
      vertical
      done-icon="done"
      done-color="done"
      active-color="active"
      header-nav
      keep-alive
      ref="stepper"
      animated>
      <q-step
        :name="1"
        title="Select"
        caption="Folders or Files"
        icon="receipt"
        :done="hasBackups">
        <div style="max-height:50vh;width:100%" class="scroll">
          <tree
            :entry="{ isdir: true, isroot: true, path: disk.mountpoint }"
            v-for="disk in disks" :key="disk.id"
            :selected.sync="selected"/>
        </div>
      </q-step>
      <q-step
        :name="2"
        title="Define"
        caption="When should run"
        icon="schedule"
        :done="hasScheduler">
        <schedule v-bind.sync="scheduler"/>
        <span>Run every {{freq}} {{periodName}}</span>
      </q-step>
      <q-step
        :name="3"
        title="Name"
        caption="Identify the task"
        icon="how_to_reg"
        :done="hasName">
        <taskname :name.sync="taskname"/>
      </q-step>
      <q-step
        :name="4"
        title="Do It"
        caption="Create task"
        icon="paly_for_work"
        :done="isDone">
        <div class="column content-stretch">
          <div v-if="isReady">
            <span>Ready to create a task BKIT-{{taskname}} to run every {{freq}} {{periodName}} for backup:</span>
            <div class="q-ml-lg">
              <div v-for="(b, i) in backups" :key="'B' + i">
                {{b}}
              </div>
              <div v-if="hasExcludes" class="q-ml-sm">
                <span>But excluding</span>
                <div v-for="e in excludes" :key="'E' + e.path">
                  {{e.path}}
                </div>
                <div v-if="hasNeeds2include" class="q-ml-sm">
                  <span>Except these ones</span>
                  <div v-for="n in needs2include" :key="'N' + n.path">
                    {{n.path}}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="column items-center">
            <div class="q-mt-lg">Not ready yet. Please very if all steps are done</div>
            <div class="q-ma-xs">{{whyNotReady}}</div>
          </div>
          <q-btn v-if="isReady" @click="submit" icon-right="subdirectory_arrow_left" rounded push outline
            size="md" color="button" class="q-ma-sm q-mt-lg" label="Enter"/>
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
          <div v-for="(filter, index) in filters" :key="index">
            <!-- {{index}}: {{filter}} -->
          </div>
          <q-btn flat color="warning" @click="cancel" no-caps label="Cancel" class="q-ma-sm" style="margin-top: auto"/>
        </q-stepper-navigation>
      </template>
    </q-stepper>
    <q-dialog
      v-model="askuser" transition-show="scale" transition-hide="scale">
      <q-card>
        <q-bar>
          <div class="text-warning">File already exist</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>
        <q-card-section>
          If continue it will override the existing file
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="button" v-close-popup />
          <q-btn flat label="Continue" color="danger" @click="force" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </main>
</template>

<script>

import tree from './Tree'
import taskname from './Taskname'
import schedule from './Schedule'
import { listLocalDisks, createTask } from 'src/helpers/bkit'
const { sep: SEP } = require('path')

const compare = (a, b) => {
  if (a.toLowerCase() < b.toLowerCase()) return -1
  if (a.toLowerCase() > b.toLowerCase()) return 1
  return 0
}
const compareReverse = (a, b) => compare(b, a)
const bypath = (a, b) => compareReverse(a.path, b.path)

const periods = [
  {
    value: '-d',
    label: 'Day(s)'
  },
  {
    value: '-m',
    label: 'Minute(s)'
  },
  {
    value: '-w',
    label: 'week(s)'
  },
  {
    value: '-h',
    label: 'Hour(s)'
  }
]

export default {
  name: 'newtask',
  data () {
    return {
      askuser: false,
      disks: [],
      selected: [],
      step: 1,
      scheduler: {
        freq: 0 | 1,
        period: '-d',
        periods,
        start: undefined
      },
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
      return this.scheduler.period
    },
    periodName () {
      return periods.find(e => e.value === this.period).label
    },
    start () {
      return this.scheduler.start
    },
    hasScheduler () {
      return this.freq > 0 && !!this.period && !!this.start
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
    },
    ancestors () {
      const reducer = (a, v) => [...a, [a.pop(), v].join(SEP)]

      const parents = this.includes.flatMap(file => {
        const steps = file.path.split(SEP)
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
            if (e.isdir) return '+/ ' + [e.path, '**'].join(SEP)
            // else return '+/ ' + e.path #there is no need to include file itsel
          } else {
            if (e.isdir) return '-/ ' + [e.path, '**'].join(SEP)
            else return '-/ ' + e.path
          }
          return undefined
        }).filter(e => e)

      return [...ancestors, ...filters]
    }
  },
  components: {
    tree,
    taskname,
    schedule
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
    create (...args) {
      const { backups, filters, taskname, period, freq, start } = this
      const fswitches = filters.map(f => `--filter=${f}`)
      console.log('backup', backups)
      console.log('filters', filters)
      createTask(...args, `--name=${taskname}`, `${period}`, freq, `--start=${start}`, ...fswitches, ...backups)
        .then(ret => {
          console.log('Return:', ret)
          this.isDone = true
        })
        .catch(err => {
          if (err.errors instanceof Array && err.errors.some(line => line.match(/already exists/))) {
            console.log('FORCE??????')
            this.askuser = true
          } else console.warn('Error', err)
        })
    },
    submit () { // We need this extra member to discard the mouseevent on first argument
      this.create()
    },
    force () {
      this.create('--force')
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
