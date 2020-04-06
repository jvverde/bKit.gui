<template>
  <q-item dense>
    <q-item-section>
      <q-item-label>
        <span>{{status}} backup of {{path}}</span>
        <q-icon name="check" color="green" v-if="isDone"/>
        <q-badge class="q-ml-xs shadow-1" color="grey-6" v-show="files.files">
          {{files.files}}
          <q-icon name="description" color="white" class="q-ml-xs"/>
          <tooltip label="Files uploaded/updated"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="red" v-show="files.size">
          {{formatBytes(files.size)}}
          <tooltip label="Size of files uploaded/updated"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="blue" v-show="total.bytes">
          {{formatBytes(total.bytes)}}
          <tooltip label="Bytes transferred"/>
        </q-badge>
      </q-item-label>
      <q-item-label caption v-if="isRunning && phase">
        Phase {{phase}}: {{phasemsg}}
      </q-item-label>
      <q-item-label caption v-if="isRunning && currentline">
        {{currentline}}
      </q-item-label>
    </q-item-section>
     <q-item-section v-if="error">
      <q-icon name="warning" color="warning">
         <tooltip :label="error"/>
      </q-icon>
    </q-item-section>
     <q-item-section v-if="isRunning">
      <q-spinner-ios color="amber"/>
    </q-item-section>
    <q-item-section side v-if="dryrun">[DRY-RUN]</q-item-section>
    <q-item-section side v-if="isDismissible">
      <q-btn flat round icon="close" color="red" size="xs" @click.stop="$emit('destroy')"/>
    </q-item-section>
    <q-item-section side v-if="isCancelable">
      <q-btn flat round icon="stop" color="red" size="xs" @click.stop="stop"/>
    </q-item-section>
  </q-item>
</template>

<script>
import { bKit } from 'src/helpers/bkit'
import { stop } from 'src/helpers/bash'
import tooltip from 'src/components/tooltip'

const formatBytes = (bytes, decimal = 2) => {
  const KB = 1024
  const MB = KB * KB
  const GB = KB * MB
  const TB = KB * GB

  if (bytes < KB) return bytes + ' Bytes'
  else if (bytes < MB) return (bytes / KB).toFixed(decimal) + ' KB'
  else if (bytes < GB) return (bytes / MB).toFixed(decimal) + ' MB'
  else if (bytes < TB) return (bytes / GB).toFixed(decimal) + ' GB'
  else return (bytes / TB).toFixed(decimal) + ' TB'
}

class Counter {
  constructor () {
    this.size = 0
    this.bytes = 0
    this.files = 0
  }
  add (size, bytes) {
    this.size += 0 | size
    this.bytes += 0 | bytes
    this.files++
  }
}

export default {
  name: 'Backup',
  data () {
    return {
      total: new Counter(),
      transferred: new Counter(),
      updated: new Counter(),
      created: new Counter(),
      hlinks: new Counter(),
      slinks: new Counter(),
      dirs: new Counter(),
      files: new Counter(),
      specials: new Counter(),
      devices: new Counter(),
      phase: undefined,
      phasemsg: '',
      fullpath: undefined,
      status: undefined,
      error: null,
      currentline: '',
      process: undefined,
      dequeued: () => null,
      dryrun: false
    }
  },
  computed: {
    isRunning () {
      return this.status === 'Running'
    },
    isDone () {
      return this.status === 'Done'
    },
    isCanceled () {
      return this.status === 'Canceled'
    },
    onQueue () {
      return this.status === 'Enqueued'
    },
    isCancelable () {
      return !this.isDone && !this.isCanceled
    },
    isDryRun () {
      return this.dryrun
    },
    isDismissible () {
      return this.isDone || this.isCanceled
    }
  },
  components: {
    tooltip
  },
  props: {
    path: {
      type: String,
      required: true
    },
    done: {
      type: Function,
      default: () => console.log('NO CALL BACK')
    }
  },
  methods: {
    formatBytes,
    stop () {
      if (this.process) {
        stop(this.process)
          .then(() => { this.process = undefined })
          .catch(err => console.error(err))
      }

      if (this.onQueue && this.dequeued instanceof Function) {
        console.log('Dequeued')
        this.dequeued()
      }
      // this.$emit('destroy', this.path)
      this.status = 'Canceled'
    },
    sent ({
      // YXcstpoguax
      // <Y><X><s><t><poguax><file><BS><bytes><size><time>
      Y, X, s, t, file, bytes, size
    }, match, line) {
      size = Number(size)
      bytes = Number(bytes)
      this.status = 'Running'
      this.currentline = line
      if (X === 'f') {
        this.total.add(size, bytes)
        if (Y === '<') {
          this.transferred.add(size, bytes)
          if (this.phase === 1) this.files.add(size, bytes)
        } else if (Y === '.') {
          this.updated.add(size, bytes)
          if (this.phase === 1) this.files.add(size, bytes)
        } else if (Y === 'h') {
          this.hlinks.add(size, bytes)
        } else if (Y === 'c') {
          this.created.add(size, bytes)
        }
      } else if (X === 'd') {
        this.dirs.add(size, bytes)
      } else if (X === 'L') {
        this.slinks.add(size, bytes)
      } else if (X === 'S') {
        this.specials.add(size, bytes)
      } else if (X === 'D') {
        this.devices.add(size, bytes)
      } else {
        throw new Error(`Itemize YXcstpoguax with wrong value on X=${X}`)
      }
    },
    async backup () {
      this.error = null
      // this.dryrun = true
      return bKit(this.path, {
        // rsyncoptions: ['--dry-run'],
        sent: this.sent,
        newphase: ({ phase, msg }) => {
          console.log('Phase', phase, this.path)
          this.status = 'Running'
          this.phase = 0 | phase
          this.phasemsg = msg
          this.currentline = ''
        },
        done: msg => {
          console.log('Done bkit')
          this.status = 'Done'
          this.phase = this.process = undefined
          this.currentline = ''
        },
        start: () => {
          this.status = 'Starting'
        },
        enqueued: (item) => {
          this.status = 'Enqueued'
          this.dequeued = item.dismiss
        },
        oncespawn: (process) => {
          console.log('Launching', process, this.path)
          this.status = 'Launching'
          this.process = process
        }
      }).then(code => {
        console.log('Backup End Code', code)
        this.done(this.path)
      }).catch(e => {
        this.error = e
        console.error('Backup catch error', e, this.path)
      })
    }
  },
  mounted () {
    this.backup()
  },
  beforeUpdate () {
    // console.log('beforeUpdate', this.path)
  },
  beforeDestroy () {
    // console.log('Before go to destroy', this.process, this.path)
  }
}
</script>
