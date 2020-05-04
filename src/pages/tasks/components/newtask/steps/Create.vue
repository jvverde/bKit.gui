<template>
  <div class="column no-wrap full-width content-stretch">

    <div>
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

    <q-btn rounded push outline
      v-if="!result"
      size="md" color="button"
      class="q-ma-sm q-mt-lg" icon-right="subdirectory_arrow_left"
      label="Create Task" @click="submit" :loading="loading"/>

    <div v-else class="column no-wrap">
      <q-badge color="bkit" class="result ellipsis q-ml-xl q-px-sm q-py-xs" v-for="(res, index) in result" :key="index + res">
        {{res}}
      </q-badge>
    </div>
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
          <q-btn flat label="Cancel" color="ok" v-close-popup />
          <q-btn flat label="Continue" color="danger" @click="force" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </div>
</template>

<script>

import { createTask } from 'src/helpers/bkit'
const { sep: SEP } = require('path')
import Scheduler from 'src/helpers/scheduler'

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
      askuser: false,
      loading: false,
      result: null
    }
  },
  props: {
    backups: {
      type: Array,
      require: true
    },
    includes: {
      type: Array,
      default: () => []
    },
    excludes: {
      type: Array,
      default: () => []
    },
    taskname: {
      type: String,
      default: Date.now() + Math.random().toString(36).slice(1)
    },
    scheduler: {
      type: Scheduler,
      required: true
    }
  },
  computed: {
    period () {
      return this.scheduler.value()
    },
    periodName () {
      return this.scheduler.label()
    },
    freq () {
      return this.scheduler.freq
    },
    start () {
      return this.scheduler.start
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
  },
  methods: {
    create (...args) {
      this.loading = true
      const { backups, filters, taskname, period, freq, start } = this
      const fswitches = filters.map(f => `--filter=${f}`)
      console.log('backup', backups)
      console.log('filters', filters)
      createTask(...args, `--name=${taskname}`, '--install', `${period}`, freq, `--start=${start}`, ...fswitches, ...backups)
        .then(ret => {
          this.result = ret.result || []
          this.$emit('done', this.result)
        })
        .catch(err => {
          if (err.errors instanceof Array && err.errors.some(line => line.match(/already exists/))) {
            this.askuser = true
          } else console.warn('Error', err)
        })
        .finally(() => {
          this.loading = false
        })
    },
    submit () { // We need this extra member to discard the mouseevent on first argument
      this.create()
    },
    force () {
      this.create('--force')
    }
  }
}
</script>
<style type="text/css">
  .result:not(:last-child):not(:first-child) {
    border-radius: unset
  }
  .result:first-child {
    border-bottom-left-radius : unset;
    border-bottom-right-radius : unset;
  }
  .result:last-child {
    border-top-left-radius : unset;
    border-top-right-radius : unset;
  }
</style>
