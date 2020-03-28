<template>
  <q-item dense>
    <q-item-section thumbnail class="q-pl-xs">
      <q-btn round outline icon="close" color="red" size="xs" @click.stop="destroy"/>
    </q-item-section>
    <q-item-section>
      <q-item-label>
        {{message}} {{path}}
        <q-badge class="q-ml-xs shadow-1" color="grey-6" v-show="totalfiles">
          {{totalfiles}}
          <q-icon name="description" color="white" class="q-ml-xs"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="green" v-if="recv">
          {{recv}}
          <q-icon name="description" color="white" class="q-ml-xs"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="red" v-show="totalsize">
          {{totalsize}}
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="blue" v-if="currentrate && running">
          {{currentrate}}
        </q-badge>
      </q-item-label>
      <q-item-label caption v-if="running && currentfile">
        {{currentfile}}
      </q-item-label>
    </q-item-section>
    <q-item-section side v-if="running && sizepercent">
      <q-circular-progress
        show-value
        font-size="9px"
        :value="sizepercent"
        size="55px"
        :thickness="0.22"
        color="teal"
        track-color="grey-3"
        class="q-ma-md">
        {{ sizepercent }}% size
      </q-circular-progress>
    </q-item-section>
    <q-item-section side v-if="running && filespercent">
      <q-circular-progress
        show-value
        font-size="9px"
        :value="filespercent"
        size="55px"
        :thickness="0.22"
        color="teal"
        track-color="grey-3"
        class="q-ma-md">
        {{ filespercent }}% files
      </q-circular-progress>
    </q-item-section>
    <q-item-section side v-if="isDryRun">[DRY-RUN]</q-item-section>
    <q-item-section side v-if="error !== null">
      <q-icon name="warning" color="warning"/>
    </q-item-section>
    <q-item-section side>
      <q-spinner-gears  v-if="running && totalfiles === 0"
        color="primary"
        size="2em"
      />
      <q-icon name="done_all" color="positive" v-if="done"/>
    </q-item-section>
  </q-item>
</template>

<script>
import { rkit } from 'src/helpers/bkit'
import { Resource } from 'src/helpers/types'

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
      recv: 0,
      needatencion: 0,
      updated: 0,
      totalsize: 0,
      sizepercent: 0,
      currentfile: '',
      currentrate: '',
      watch: null
    }
  },
  computed: {
    message () {
      if (this.running) return 'Restoring'
      else if (this.done) return 'Done restore of'
      else return ''
    },
    path () {
      return this.resource.path
    },
    running () {
      return this.status === 'running'
    },
    done () {
      return this.status === 'done'
    },
    filespercent () {
      if (this.totalfiles) return Math.trunc(100 * (this.recv / this.totalfiles))
      else return 0
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
    destroy () {
      // bkit.stop(this.fd)
      this.$emit('destroy')
    },
    restore () {
      this.totalfiles = this.totalsize = 0
      this.error = null
      const { path, options, rsyncoptions, snap, rvid } = this.resource
      options.push(
        `--snap=${snap}`,
        `--rvid=${rvid}`
      )
      rkit(path, options, rsyncoptions, {
        onstart: () => {
          this.status = 'running'
        },
        onrecvfile: (match) => {
          this.recv++
          this.currentfile = match[4]
        },
        onfinish: () => {
          this.status = 'done'
        },
        onprogress: (match) => {
          this.sizepercent = 0 | match[2]
          this.totalsize = match[1]
          this.currentrate = match[3]
        },
        ontotalfiles: (n) => { this.totalfiles = n },
        ontotalsize: (val) => { this.totalsize = val }
      })
    }
  },
  mounted () {
    console.log('I am ready to restore', this.resource)
    this.restore()
  },
  beforeDestroy () {
    /* console.log('Destroy')
    if (this.watch) this.watch.close().then(() => console.log('Watcher closed')) */
  }
}
</script>
