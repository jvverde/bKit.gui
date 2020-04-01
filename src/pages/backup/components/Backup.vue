<template>
  <q-item dense>
    <q-item-section thumbnail class="q-pl-xs">
      <q-btn round outline icon="close" color="red" size="xs" @click.stop="destroy"/>
    </q-item-section>
    <q-item-section>
      <q-item-label>
        {{status}} backup of {{path}}
        <q-badge class="q-ml-xs shadow-1" color="grey-6" v-show="total.files">
          {{total.files}}
          <q-icon name="description" color="white" class="q-ml-xs"/>
          <tooltip label="Total Files"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="red" v-show="total.size">
          {{total.size}}
          <tooltip label="Total Size"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="blue" v-show="total.bytes">
          {{total.bytes}}
          <tooltip label="Total Bytes"/>
        </q-badge>
      </q-item-label>
      <q-item-label caption v-if="phase">
        Phase {{phase}}: {{phasemsg}}
      </q-item-label>
      <q-item-label caption v-if="running && currentfile">
        {{currentfile}}
      </q-item-label>
    </q-item-section>
    <q-item-section side v-if="dryrun">[DRY-RUN]</q-item-section>
    <q-item-section side v-if="error !== null">
      <q-icon name="warning" color="warning"/>
    </q-item-section>
  </q-item>
</template>

<script>
import { bKit } from 'src/helpers/bkit'
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
      specials: new Counter(),
      devices: new Counter(),
      phase: undefined,
      phasemsg: '',
      fd: null,
      fullpath: undefined,
      status: undefined,
      error: null,
      totalfiles: 0,
      needatencion: 0,
      totalsize: 0,
      totalbytes: 0,
      sizepercent: 0,
      currentfile: '',
      currentrate: '',
      dryrun: false
    }
  },
  computed: {
    running () {
      return this.status === 'Running'
    },
    done () {
      return this.status === 'Done'
    },
    filespercent () {
      if (this.totalfiles) return Math.trunc(100 * (this.sent / this.totalfiles))
      else return 0
    },
    isDryRun () {
      return this.dryrun
    }
  },
  components: {
    tooltip
  },
  props: {
    path: {
      type: String,
      required: true
    }
  },
  methods: {
    destroy () {
      // bkit.stop(this.fd)
      this.$emit('destroy')
    },
    sent ({
      // YXcstpoguax
      // <Y><X><s><t><poguax><file><BS><bytes><size><time>
      Y, X, s, t, file, bytes, size
    }) {
      this.status = 'Running'
      this.currentfile = file
      if (X === 'f') {
        this.total.add(size, bytes)
        if (Y === '<') {
          this.transferred.add(size, bytes)
        } else if (Y === '.') {
          this.updated.add(size, bytes)
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
    backup () {
      this.totalfiles = this.totalsize = 0
      this.error = null
      this.dryrun = true
      return bKit(this.path, {
        rsyncoptions: ['--dry-run'],
        sent: this.sent,
        newphase: ({ phase, msg }) => {
          this.status = 'Running'
          this.phase = phase
          this.phasemsg = msg
          this.currentfile = ''
        },
        done: msg => {
          this.status = 'Done'
          this.phase = undefined
        },
        start: () => {
          this.status = 'Starting'
        },
        enqueued: (queue, key, promise) => {
          this.status = 'Enqueued'
          this.enqueue = { queue, key }
        },
        oncespawn: (fd) => {
          this.status = 'Launching'
        }
      }).then(code => {
        console.log('End code', code)
      }).catch(e => {
        console.error('Backup error', e)
      })
    }
  },
  mounted () {
    this.backup()
  },
  beforeDestroy () {
  }
}
</script>
