<template>
  <q-item dense>
    <q-item-section thumbnail class="q-pl-xs">
      <q-btn round outline icon="close" color="red" size="xs" @click.stop="destroy"/>
    </q-item-section>
    <q-item-section>
      <q-item-label>
        {{status}} backup of {{path}}
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
      <q-item-label caption v-if="phase">
        Phase {{phase}}: {{phasemsg}}
      </q-item-label>
      <q-item-label caption v-if="running && currentline">
        {{currentline}}
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
      localfiles: 0,
      localsize: 0,
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
      currentline: '',
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
    },
    cb: {
      type: Function,
      default: () => console.log('NOOOOOOOOOOO CALL BACK')
    }
  },
  methods: {
    formatBytes,
    destroy () {
      // bkit.stop(this.fd)
      this.$emit('destroy')
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
      this.totalfiles = this.totalsize = 0
      this.error = null
      // this.dryrun = true
      return bKit(this.path, {
        // rsyncoptions: ['--dry-run'],
        sent: this.sent,
        newphase: ({ phase, msg }) => {
          this.status = 'Running'
          this.phase = 0 | phase
          this.phasemsg = msg
          this.currentline = ''
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
        console.log('Backup End Code', code)
        this.cb(this.path)
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
