<template>
  <q-item dense v-if="!deleted">
    <q-item-section>
      <q-item-label>
        <q-spinner-ios color="amber" v-if="isRunning"/>
        <q-icon name="check" color="green" v-if="isDone"/>
        <q-icon name="warning" color="warning" v-if="error">
          <tooltip :label="error"/>
        </q-icon>
        <span>{{status}} restore of {{path}}</span>
        <q-badge class="q-ml-xs shadow-1" color="indigo" v-if="totalfiles">
          {{totalfiles}}
          <q-icon name="description" color="white" class="q-ml-xs"/>
          <tooltip label="Number of files"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="green" v-if="isRunning && cntfiles">
          {{cntfiles}}
          <q-icon name="description" color="white" class="q-ml-xs"/>
          <tooltip label="Number of files so far"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="cyan" v-if="totalsize">
          {{totalsize}}
          <tooltip label="Size of transferred files"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="teal" v-if="isRunning && currentsize">
          {{currentsize}}
          <tooltip label="Total size so far"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="blue" v-if="isRunning && currentrate">
          {{currentrate}}
          <tooltip label="Actual download rate"/>
        </q-badge>
      </q-item-label>
      <q-item-label caption v-if="isRunning && currentfile">
        {{currentfile}}
      </q-item-label>
    </q-item-section>
    <q-item-section side v-if="isRunning && sizepercent">
      <q-circular-progress
        show-value
        font-size="9px"
        :value="sizepercent"
        size="55px"
        :thickness="0.22"
        color="green"
        track-color="grey-3"
        class="q-ma-md">
        {{ sizepercent }}% size
      </q-circular-progress>
    </q-item-section>
    <q-item-section side v-if="isRunning && filespercent">
      <q-circular-progress
        show-value
        font-size="9px"
        :value="filespercent"
        size="55px"
        :thickness="0.22"
        color="green"
        track-color="grey-3"
        class="q-ma-md">
        {{ filespercent }}% files
      </q-circular-progress>
    </q-item-section>
    <q-item-section side v-if="isDryRun">[DRY-RUN]</q-item-section>
    <q-item-section side v-if="isDismissible">
      <q-btn flat round icon="close" color="red" size="xs" @click.stop="deleted = true"/>
    </q-item-section>
    <q-item-section side v-if="isCancelable">
      <q-btn flat round icon="stop" color="red" size="xs" @click.stop="cancel"/>
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
      totalfiles: 0,
      cntfiles: 0,
      needatencion: 0,
      updated: 0,
      totalsize: 0,
      currentpercent: 0,
      currentfile: '',
      currentrate: '',
      currentsize: 0,
      deleted: false,
      currentsizeinbytes: 0,
      pid: undefined,
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
    isRunning () {
      return this.status === 'Running'
    },
    isDone () {
      return this.status === 'Done'
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
      return this.totalfiles ? Math.trunc(100 * (this.cntfiles / this.totalfiles)) : 0
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
    }
  },
  methods: {
    formatBytes,
    cancel () {
      if (this.pid) {
        killtree(this.pid)
          .then(() => { this.pid = undefined })
          .catch(err => console.error(err))
      }

      if (this.onQueue && this.dequeued instanceof Function) {
        console.log('Dequeued')
        this.dequeued()
      }

      this.status = 'Canceled'
    },
    destroy () {
      // bkit.stop(this.fd)
      this.$emit('destroy')
    },
    restore () {
      this.totalfiles = this.totalsize = this.cntfiles = 0
      this.error = null
      const { path, options, rsyncoptions, snap, rvid } = this.resource
      options.push(
        `--snap=${snap}`,
        `--rvid=${rvid}`
      )
      rKit(path, options, rsyncoptions, {
        enqueued: (item) => {
          this.status = 'Enqueued'
          this.dequeued = item.dismiss
        },
        onstart: ({ pid }) => {
          this.status = 'Starting'
          this.pid = pid
          console.log(`Starting rKit [pid:${pid}]`)
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
        onrecvfile: ({ file, size }) => {
          this.status = 'Running'
          this.cntfiles++
          this.currentfile = file
          this.currentsizeinbytes += Number(size)
        },
        onprogress: ({ size, percent, rate }) => {
          this.status = 'Running'
          this.currentpercent = Number(percent)
          this.currentsize = size
          this.currentrate = rate
        },
        ontotalfiles: (n) => { this.totalfiles = Number(n) },
        ontotalsize: (val) => { this.totalsize = val }
      })
    }
  },
  mounted () {
    this.restore()
  },
  beforeDestroy () {
    /* console.log('Destroy')
    if (this.watch) this.watch.close().then(() => console.log('Watcher closed')) */
  }
}
</script>
