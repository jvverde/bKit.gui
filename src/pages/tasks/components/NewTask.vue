<template>
  <main class="relative scroll">
    <q-stepper
      class="row no-wrap justify-between b-stepper"
      v-model="step"
      vertical
      done-icon="done"
      done-color="positive"
      active-color="lime"
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
        :done="when">
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
            <span>Ready to create a task BKIT-{{taskname}} to run every xxx for backup</span>
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
          <q-btn v-if="isReady" icon-right="subdirectory_arrow_left" rounded push outline
            size="md" color="positive"
            class="q-ma-sm q-mt-lg"
            label="Enter"/>
        </div>
      </q-step>
      <template v-slot:navigation>
        <q-stepper-navigation class="column no-wrap">
          <q-btn v-if="showNext" @click="next" icon-right="keyboard_arrow_down"
            no-caps outline color="positive" label="Next"/>
          <q-btn v-else-if="showLast" @click="finish"
            no-caps outline color="positive" label="Finish"/>
          <q-btn :disable="!showBack" flat color="positive" icon="keyboard_arrow_up"
            no-caps @click="back" label="Back" class="q-ma-sm"/>
          <div class="q-ma-md bg-lime-1">
            <q-bar dense v-if="hasBackups">Backup</q-bar>
            <q-chip dense color="positive" outline :label="b"
              size="sm"
              v-for="(b, i) in backups" :key="'b' + i"/>
            <q-bar dense v-if="hasExcludes">Excluding</q-bar>
            <q-chip dense color="negative" outline :label="e.path"
              size="sm"
              v-for="e in excludes" :key="'e' + e.path"/>
            <q-bar dense v-if="hasNeeds2include">Including</q-bar>
            <q-chip dense color="positive" outline :label="n.path"
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
import taskname from './Taskname'
import schedule from './Schedule'
import { listLocalDisks } from 'src/helpers/bkit'
const { sep: _SEP } = require('path')
const task = require('windows-scheduler')

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
      disks: [],
      selected: [],
      step: 1,
      scheduler: {
        freq: 1,
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
    when () {
      return this.freq > 0 && !!this.period && !!this.start
    },
    hasName () {
      return !!this.taskname
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
    isReady () {
      return this.hasBackups && this.hasName && this.when
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
    tree,
    taskname,
    schedule
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
    checkName () {
      console.log(this.taskname)
      task.get('BKIT-' + this.taskname, 'LIST')
        .then(list => {
          console.log('list', list)
          this.tasknameInvalid = true
        }).catch(e => {
          this.tasknameInvalid = false
          this.tasknameValid = true
        })
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
