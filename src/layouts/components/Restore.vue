<template>
  <q-item dense v-if="!deleted">
    <q-item-section>
      <q-item-label>
        <q-spinner-ios color="loader" v-if="isRunning"/>
        <q-icon name="check" color="done" v-if="isDone"/>
        <q-icon name="warning" color="warning" v-if="error">
          <tooltip :label="error"/>
        </q-icon>
        <span>{{status}} restore of {{path}}</span>
        <q-badge class="q-ml-xs shadow-1" color="badger" v-if="totalfiles">
          {{totalfiles}}
          <q-icon name="description" color="white" class="q-ml-xs"/>
          <tooltip label="Number of files"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="badger-1" v-if="isRunning && cntfiles">
          {{cntfiles}} of {{totalfiles}}
          <q-icon name="description" color="white" class="q-ml-xs"/>
          <tooltip label="Number of files so far"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="badger-2" v-if="totalsize">
          {{totalsize}}
          <tooltip label="Size of transferred files"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="badger-3" v-if="isRunning && currentsize">
          {{currentsize}}
          <tooltip label="Total size so far"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="badger-4" v-if="isRunning && currentrate">
          {{currentrate}}
          <tooltip label="Actual download rate"/>
        </q-badge>
      </q-item-label>
      <q-item-label caption v-if="isRunning && currentline">
        {{currentline}}
      </q-item-label>
    </q-item-section>
    <q-item-section side v-if="isRunning">
      <q-circular-progress
        show-value
        font-size="9px"
        :value="sizepercent"
        size="55px"
        :thickness="0.22"
        color="bkit"
        track-color="yellow-1"
        class="q-ma-md">
        {{ sizepercent }}% size
      </q-circular-progress>
    </q-item-section>
    <q-item-section side v-if="isRunning">
      <q-circular-progress
        show-value
        font-size="9px"
        :value="filespercent"
        size="55px"
        :thickness="0.22"
        color="bkit"
        track-color="yellow-1"
        class="q-ma-md">
        {{ filespercent }}% files
      </q-circular-progress>
    </q-item-section>
    <q-item-section side v-if="isDryRun">[DRY-RUN]</q-item-section>
    <q-item-section side v-if="isDismissible">
      <q-btn flat round icon="close" color="dismmiss" size="xs" @click.stop="deleted = true"/>
    </q-item-section>
    <q-item-section side v-if="isCancelable">
      <q-btn flat round icon="stop" color="cancel" size="xs" @click.stop="cancel"/>
    </q-item-section>
  </q-item>
</template>

<script>
import { rKit } from 'src/helpers/bkit'
import { Resource } from 'src/helpers/types'
import { formatBytes } from 'src/helpers/utils'
import { killtree } from 'src/helpers/bash'

import tooltip from 'src/components/tooltip'

const isDryRun = (element) => element.match(/^--dry-run/) instanceof Array
export default {
  // name: 'ComponentName',
  data () {
    return {
      fd: null,
      fullpath: undefined,
      recoverydir: undefined,
      status: undefined,
      error: null,
      ok: undefined,
      finished: false,
      totalfiles: 0,
      cntfiles: 0,
      needatencion: 0,
      updated: 0,
      totalsize: 0,
      currentpercent: 0,
      currentline: null,
      currentrate: '',
      currentsize: 0,
      deleted: false,
      currentsizeinbytes: 0,
      pid: undefined,
      pgid: undefined,
      dequeued: () => null,
      watch: null
    }
  },
  components: {
    tooltip
  },
  computed: {
    path () {
      return this.resource.path
    },
    isFinished () {
      return this.finished === true
    },
    isRunning () {
      return this.status === 'Running' && !this.isFinished
    },
    isDone () {
      return this.status === 'Done' && this.isFinished
    },
    isCanceled () {
      return this.status === 'Canceled'
    },
    isDismissible () {
      return this.isDone || this.isCanceled
    },
    onQueue () {
      return this.status === 'Enqueued'
    },
    isCancelable () {
      return !this.isDone && !this.isCanceled
    },
    filespercent () {
      return this.totalfiles ? Math.trunc(1000 * (this.cntfiles / this.totalfiles)) / 10 : 0
    },
    sizepercent () {
      return this.currentpercent
    },
    isDryRun () {
      return this.resource.rsyncoptions.some(isDryRun) || this.resource.options.some(isDryRun)
    }
  },
  props: {
    resource: {
      type: Resource,
      required: true
    },
    done: {
      type: Function,
      default: () => console.log('NO DONE CALL BACK')
    }
  },
  methods: {
    formatBytes,
    cancel () {
      if (this.pgid) {
        killtree(this.pgid)
          .then(() => {
            this.pid = undefined
            this.gpid = undefined
            this.status = 'Canceled'
          })
          .catch(err => console.error(err))
      }

      if (this.onQueue && this.dequeued instanceof Function) {
        console.log('Dequeued')
        this.dequeued()
      }
    },
    destroy () {
      // bkit.stop(this.fd)
      this.$emit('destroy')
    },
    restore () {
      this.totalfiles = this.totalsize = this.cntfiles = 0
      this.error = null
      console.log('resource', this.resource)
      const { path, options: o, rsyncoptions: r, snap, rvid } = this.resource
      const options = [...o] // Resource came from VUEX and shoudn't be modified outside a mutation
      const rsyncoptions = [...r, '--delay-updates']
      options.push(
        `--snap=${snap}`,
        `--rvid=${rvid}`
      )
      rKit(path, options, rsyncoptions, {
        enqueued: (item) => {
          this.status = 'Enqueued'
          this.dequeued = item.dismiss
        },
        onstart: ({ pid, pgid }) => {
          this.status = 'Starting'
          this.pid = pid
          this.pgid = pgid
          console.log(`Starting rKit [${pid}:${pgid}]`)
        },
        oncespawn: () => {
          this.status = 'Launching'
        },
        stderr: (line) => {
          console.warn(line)
          this.currentline = line
          this.cnterrors++
        },
        onfinish: () => {
          this.status = 'Done'
        },
        onrecvfile: ({ size }, line) => {
          this.status = 'Running'
          this.cntfiles++
          this.currentline = line
          this.currentsizeinbytes += Number(size)
        },
        onprogress: ({ size, percent, rate }) => {
          this.status = 'Running'
          this.currentpercent = Number(percent)
          this.currentsize = size
          this.currentrate = rate
        },
        ontotalfiles: n => { this.totalfiles = Number(n) }, // Not fired without rsync '--delay-updates'
        ontotalsize: val => { this.totalsize = val }
      }).then(code => {
        console.log('Restore Done with code', code)
        this.done(this.path)
        this.ok = true
      }).catch(e => {
        console.error('Restore catch error', e, this.path)
        this.error = e
      }).finally(() => {
        this.finished = true
        this.pid = undefined
        if (this.pgid) killtree(this.pgid)
        this.pgid = undefined
      })
    },
    async beforeWindowUnload () {
      if (this.pgid) await killtree(this.pgid)
    }
  },
  mounted () {
    window.addEventListener('beforeunload', this.beforeWindowUnload)
    this.restore()
  },
  beforeDestroy () {
    window.removeEventListener('beforeunload', this.beforeWindowUnload)
    /* console.log('Destroy')
    if (this.watch) this.watch.close().then(() => console.log('Watcher closed')) */
  }
}
</script>
