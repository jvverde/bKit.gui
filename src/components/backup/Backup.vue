<template>
  <q-item dense v-if="!deleted">
    <q-item-section>
      <q-item-label>
        <q-spinner-ios color="loader" v-if="isRunning"/>
        <q-icon name="check" color="green" v-if="isDone"/>
        <q-icon name="warning" color="warning" v-if="error">
          <tooltip :label="error"/>
        </q-icon>
        <span>{{status}} backup of {{path}}</span>
        <q-badge class="q-ml-xs shadow-1" color="badger" v-show="files.files">
          {{files.files}}
          <q-icon name="description" color="white" class="q-ml-xs"/>
          <tooltip label="Files uploaded/updated"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="badger-1" v-show="files.size">
          {{formatBytes(files.size)}}
          <tooltip label="Size of files uploaded/updated"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="badger-2" v-show="total.bytes">
          {{formatBytes(total.bytes)}}
          <tooltip label="Bytes transferred"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="warning" v-show="cnterrors">
          {{cnterrors}}
          <tooltip label="Number of errors"/>
        </q-badge>
      </q-item-label>
      <q-item-label caption v-if="isRunning && phase">
        Phase {{phase}}: {{phasemsg}}
      </q-item-label>
      <q-item-label caption v-if="isRunning && currentline">
        {{currentline}}
      </q-item-label>
    </q-item-section>
    <q-item-section side v-if="dryrun">[DRY-RUN]</q-item-section>
    <q-item-section side v-if="isDismissible">
      <q-btn flat round icon="close" color="dismiss" size="xs" @click.stop="deleted = true"/>
    </q-item-section>
    <q-item-section side v-if="isCancelable">
      <q-btn flat round icon="stop" color="cancel" size="xs" @click.stop="cancel"/>
    </q-item-section>
  </q-item>
</template>

<script>
import { bKit } from 'src/helpers/bkit'
import { killtree } from 'src/helpers/bash'
import { formatBytes } from 'src/helpers/utils'
import tooltip from 'src/components/tooltip'

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
      status: undefined,
      error: null,
      ok: undefined,
      finished: false,
      cnterrors: 0,
      currentline: '',
      process: undefined,
      pid: null,
      dequeued: () => null,
      deleted: false,
      dryrun: false
    }
  },
  computed: {
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
        start: ({ pid }) => {
          this.status = 'Starting'
          this.pid = pid
          console.log('Starting with pid', pid)
        },
        enqueued: (item) => {
          this.status = 'Enqueued'
          this.dequeued = item.dismiss
        },
        oncespawn: () => {
          this.status = 'Launching'
        },
        stderr: (line) => {
          console.warn(line)
          this.currentline = line
          this.cnterrors++
        }
      }).then(code => {
        console.log('Backup Done with code', code)
        this.done(this.path)
        this.ok = true
      }).catch(e => {
        console.error('Backup catch error', e, this.path)
        this.error = e
      }).finally(() => {
        this.finished = true
      })
    }
  },
  mounted () {
    console.log('backup', this.path)
    // this.backup()
  },
  beforeUpdate () {
    // console.log('beforeUpdate', this.path)
  },
  beforeDestroy () {
    // console.log('Before go to destroy', this.process, this.path)
  }
}
</script>
