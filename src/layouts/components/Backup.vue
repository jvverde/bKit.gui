<template>
  <q-item dense>
    <q-item-section>
      <q-item-label>
        <q-spinner-ios color="loader" v-if="isRunning"/>
        <q-icon name="hourglass_empty" color="red" v-else-if="isStarting"/>
        <q-icon name="view_timeline" color="red" v-else-if="onQueue"/>
        <q-icon name="check" color="green" v-else-if="isDone"/>
        <q-icon name="warning" color="warning" v-else-if="error">
          <tooltip :label="error"/>
        </q-icon>
        <span>{{status}} backup of {{path}}</span>
        <q-badge class="q-ml-xs shadow-1" color="badger" v-show="files.files">
          {{files.files}}
          <q-icon name="description" color="white" class="q-ml-xs"/>
          <tooltip label="Files uploaded/updated"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="badger-2" v-show="files.size">
          {{formatBytes(files.size)}}
          <tooltip label="Size of files uploaded/updated"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="badger-1" v-show="total.bytes">
          {{formatBytes(total.bytes)}}
          <tooltip label="Bytes transferred"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="warning" v-show="cnterrors">
          {{cnterrors}}
          <tooltip label="Number of errors"/>
        </q-badge>
      </q-item-label>
      <q-item-label caption v-if="isRunning">
        <span class="q-pl-lg">Phase {{phase}}: {{phasemsg}}</span>
      </q-item-label>
      <q-item-label caption v-if="isRunning">
        <span class="q-pl-lg" v-if="currentline">{{currentline}}</span>
        <span class="q-pl-lg" v-else-if="errorline" style="color: red">ERROR: {{errorline}}</span>
      </q-item-label>
    </q-item-section>
    <q-item-section>
      <q-item-label>
        <q-btn v-if="!watcher" flat round icon="track_changes" color="active" size="sm" @click.stop="watch">
          <tooltip label="Track changes"/>
        </q-btn>
        <q-btn v-else flat round icon="track_changes" color="notactive" size="sm" @click.stop="stopWatch">
          <tooltip label="Stop Tracking changes"/>
        </q-btn>
      </q-item-label>
    </q-item-section>
    <q-item-section side v-if="dryrun">[DRY-RUN]</q-item-section>
    <q-item-section side>
      <q-item-label>
        <q-btn flat round icon="backup" color="backup" size="sm" @click.stop="backup" :disable="!isStopped"  :class="{inactive: !isStopped}"/>
        <q-btn flat round icon="pause" color="cancel" size="sm" @click.stop="cancel" :disable="!isCancelable"  :class="{inactive: !isCancelable}"/>
        <q-btn flat round icon="close" color="dismiss" size="sm" @click.stop="remove" :disable="!isRemovable" :class="{inactive: !isRemovable}"/>
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script>
import { bKit } from 'src/helpers/bkit'
import { killtree } from 'src/helpers/bash'
import { formatBytes } from 'src/helpers/utils'
import tooltip from 'src/components/tooltip'
import { mapMutations } from 'vuex'
import { warn } from 'src/helpers/notify'
import { chokidar, chokidarOptions } from 'src/helpers/chockidar'
import { dismissed } from 'src/helpers/queue'

const depth = 20
const watchOptions = { ...chokidarOptions, depth }

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

const _DELTA = 300000 // 5min

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
      errorline: '',
      process: undefined,
      pid: undefined,
      pgid: undefined,
      dequeued: () => null,
      deleted: false,
      dryrun: false,
      needBackup: 0,
      watcher: undefined,
      lastRun: Date.now(),
      waiting: undefined,
      endpoint: {}
    }
  },
  computed: {
    isFinished () {
      return this.finished === true
    },
    isIdle () {
      return this.isFinished || this.status === undefined
    },
    isStarting () {
      return this.status === 'Starting'
    },
    isRunning () {
      return this.status === 'Running' && !this.isFinished
    },
    isDone () {
      return this.status === 'Done' && this.isFinished
    },
    isCanceled () {
      return this.status === 'Canceled' || this.status === 'Dequeued'
    },
    onQueue () {
      return this.status === 'Enqueued'
    },
    isCancelable () {
      return this.status && !this.isDone && !this.isCanceled
    },
    isDryRun () {
      return this.status && this.dryrun
    },
    isStopped () {
      return this.isCanceled || this.isFinished
    },
    isRemovable () {
      return this.status && this.isStopped
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
  watch: {
    needBackup (val) {
      if (this.waiting) return
      if (val > 0 && this.isIdle) {
        const now = Date.now()
        const delta = now - this.lastRun
        if (delta > _DELTA) { // 5minutos
          this.backup()
        } else {
          const self = this
          this.waiting = setTimeout(() => {
            console.log('After a timeout...')
            self.backup()
          }, _DELTA - delta)
          console.log('Set timeout for', _DELTA - delta)
        }
      }
    }
  },
  methods: {
    ...mapMutations('backups', { backupDone: 'done' }),
    ...mapMutations('backups', ['rmPath']),
    remove () {
      this.rmPath(this.path)
    },
    async watch () {
      console.log('Watch')
      if (this.watcher) {
        await this.watcher.close()
        console.log('Add watcher', this.path)
        this.watcher.add(this.path)
      } else {
        this.watcher = chokidar.watch(this.path, watchOptions)
        console.log('Start Watching', this.path)
      }
      this.watcher.on('all', (event, path) => {
        this.needBackup++
        console.log(`Event ${event} on ${path}`)
      }).on('error', error => warn(`Watcher error: ${error} on path ${this.path}`, false))
    },
    async stopWatch () {
      try {
        if (this.watcher) {
          await this.watcher.close()
          console.log(`Whatcher on ${this.fullpath} closed`)
        }
      } catch (err) {
        warn(err, false)
      } finally {
        this.watcher = undefined
      }
    },
    formatBytes,
    async cancel () {
      try {
        if (this.pid) {
          await killtree(this.pid)
          this.pid = undefined
        }
        if (this.onQueue && this.dequeued instanceof Function) {
          console.log('Dequeued')
          this.dequeued()
        }
      } catch (err) {
        console.error(`Cancel catch an error for [${this.pid}] ${this.path}`, err)
      } finally {
        this.status = 'Canceled'
      }
    },
    sent ({
      // YXcstpoguax
      // <Y><X><s><t><poguax><file><BS><bytes><size><time>
      Y, X, s, t, file, bytes, size
    }, match, line) {
      size = Number(size)
      bytes = Number(bytes)
      this.$nextTick(() => {
        this.status = 'Running'
        this.currentline = line
        this.errorline = ''
        console.log(line)
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
      })
    },
    async backup () {
      this.error = null
      this.finished = false
      // this.dryrun = true
      return bKit(this.path, {
        // rsyncoptions: ['--dry-run'],
        sent: this.sent,
        newphase: ({ phase, msg }) => {
          console.log('Phase', phase, msg)
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
        saved: endpoint => {
          console.log('Your data is saved on', endpoint)
        },
        start: ({ pid, pgid }) => {
          this.status = 'Starting'
          this.pid = pid
          this.pgid = pgid
          console.log(`Starting with pid ${pid} and pgid ${pgid}`)
        },
        enqueued: (item) => {
          this.status = 'Enqueued'
          this.dequeued = item.dismiss
        },
        oncespawn: (fd) => {
          console.log('Launching', fd)
          this.status = 'Launching'
        },
        stderr: (line) => {
          console.warn(line)
          this.errorline = line
          this.currentline = ''
          this.cnterrors++
        }
      }).then(code => {
        console.log('Backup Done with code', code)
        this.ok = true
        this.status = 'Done'
        const { path, endpoint } = this
        this.backupDone({ path, endpoint })
      }).catch(e => {
        if (e === dismissed) {
          this.status = 'Dequeued'
        } else {
          console.error('Backup catch error', e, this.path)
          this.error = e
          this.status = 'Error'
        }
      }).finally(() => {
        this.finished = true
        this.needBackup = 0
        this.pid = undefined
        this.lastRun = Date.now()
        this.waiting = undefined
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
    this.backup()
  },
  beforeUpdate () {
    // console.log('beforeUpdate', this.path)
  },
  beforeDestroy () {
    this.stopWatch()
    window.removeEventListener('beforeunload', this.beforeWindowUnload)
  }
}
</script>

<style scoped lang="scss">
  .inactive {
    color: transparent !important;
    pointer-events: none;
  }
</style>
