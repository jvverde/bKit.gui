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
import * as bkit from 'src/helpers/bash'
const regex = /^"recv\|(.)(.)([^|]+)\|([^|]+)\|([^|]+)\|.*"$/
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
      return this.resource.rsyncoptions.some(isDryRun)
    }
  },
  props: {
    resource: {
      type: Object,
      required: true
    }
  },
  methods: {
    destroy () {
      bkit.stop(this.fd)
      this.$emit('destroy')
    },
    restore () {
      this.totalfiles = this.totalsize = 0
      this.error = null
      const { path, options, rsyncoptions, snap, disk } = this.resource
      options.push(
        `--snap=${snap}`,
        `--rvid=${disk.rvid}`
      )
      this.rkit(path, options, rsyncoptions, {
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
        }
      })
    },
    rkit (path, options, rsyncoptions, {
      onstart = () => {},
      onfinish = () => {},
      ondata = () => {},
      onrecvfile = () => {},
      ontotalfiles = (n) => { this.totalfiles = n },
      ontotalsize = (val) => { this.totalsize = val },
      onprogress = null,
      onclose = () => {}
    }) {
      this.totalfiles = 0
      this.fd = bkit.bash('./rkit.sh', [
        ...options,
        '--', // now rsync options
        ...rsyncoptions,
        '--no-A', '--no-g', '--no-p',
        '--delay-updates', // if we want to receive a file list ahead
        '--progress',
        '--info=PROGRESS2,STATS2,NAME2',
        path
      ], {
        onerror: (err) => {
          this.error = `${err}`
          console.error('error=', this.error)
          this.$q.notify({
            message: this.error,
            multiline: true,
            icon: 'warning'
          })
        },
        onclose: (code) => console.log(`Script rkit ends with code ${code}`),
        onreadline: (data) => {
          console.info(data)
          this.$nextTick(() => {
            if (data.match(/^Start Restore/)) onstart(data)
            else if (data.match(/^Finish at/)) onfinish(data)
            else {
              const recv = data.match(regex)
              if (recv instanceof Array) onrecvfile(recv)
              else {
                const match = data.match(/^\s*(\d+)\s+files/)
                if (match instanceof Array) {
                  ontotalfiles(0 | match[1])
                } else {
                  const matchsize = data.match(/^total size is (.+?)\s/)
                  if (matchsize instanceof Array) ontotalsize(matchsize[1])
                  else if (onprogress) { // don't waist time if handler is not defined
                    const progress = data.match(/\s*([0-9.mkgb]+)\s+([0-9]+)%\s+([0-9.mkgb/s]+)/i)
                    if (progress instanceof Array) {
                      onprogress(progress)
                    }
                  }
                }
              }
            }
          })
        }
      })
      console.log('Called rkit')
    }
  },
  mounted () {
    console.log('Restore resource:', this.resource)
    this.restore()
  },
  beforeDestroy () {
    /* console.log('Destroy')
    if (this.watch) this.watch.close().then(() => console.log('Watcher closed')) */
  }
}
</script>
