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
import { error } from 'src/helpers/notify'
import { chokidar, chokidarOptions } from 'src/helpers/chockidar'
import state, { _CANCELREQUEST, _CANCELED, _RUNNING, _DONE, _ERROR } from './mixins/state'

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

const nill = () => null

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
      finished: false,
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
  mixins: [state],
  methods: {
    ...mapMutations('backups', { backupDone: 'done' }),
    ...mapMutations('backups', ['rmPath']),
    formatBytes,
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
      }).on('error', error => console.warn(`Watcher error: ${error} on path ${this.path}`))
    },
    async stopWatch () {
      try {
        if (this.watcher) {
          await this.watcher.close()
          console.log(`Whatcher on ${this.fullpath} closed`)
        }
      } catch (err) {
        console.warn(err)
      } finally {
        this.watcher = undefined
      }
    },
    async cancel () {
      if (this.pid) {
        this.status = _CANCELREQUEST
        console.log(_CANCELREQUEST, this.path)
        try {
          await killtree(this.pid)
          this.pid = undefined
          this.status = _CANCELED
          console.log(_CANCELED, this.path)
        } catch (err) {
          console.error(`Cancel catch an error for [${this.pid}] ${this.path}`)
          error(err)
          this.status = _ERROR
          this.error = err
        }
      } else if (this.onQueue && this.dequeued instanceof Function) {
        this.dequeued()
      } else {
        error(`Invalid state(${this.status}) to cancel`)
      }
    },
    YX (x, y) { // Dispatch a action for each possible XY values of rsync loging format (YXcstpoguax)
      const error = () => {
        throw new Error(`Itemize YXcstpoguax with wrong value on X=${x}`)
      }
      const dispatch = {
        d: (size, bytes) => this.dirs.add(size, bytes),
        L: (size, bytes) => this.slinks.add(size, bytes),
        S: (size, bytes) => this.specials.add(size, bytes),
        D: (size, bytes) => this.devices.add(size, bytes),
        f: (size, bytes) => {
          this.total.add(size, bytes)
          this.Y(y)(size, bytes)
        }
      }
      return dispatch[x] || error
    },
    Y (y) { // Dispatch an action for each possible Y value of rsync loging format
      const dispatch = {
        '<': (size, bytes) => {
          this.transferred.add(size, bytes)
          if (this.phase === 1) this.files.add(size, bytes)
        },
        '.': (size, bytes) => {
          this.updated.add(size, bytes)
          if (this.phase === 1) this.files.add(size, bytes)
        },
        h: (size, bytes) => this.hlinks.add(size, bytes),
        c: (size, bytes) => this.created.add(size, bytes)
      }
      return dispatch[y] || nill
    },

    sent ({
      // YXcstpoguax
      // <Y><X><s><t><poguax><file><BS><bytes><size><time>
      Y, X, s, t, file, bytes, size
    }, match, line) {
      size = Number(size)
      bytes = Number(bytes)
      this.$nextTick(() => {
        this.status = _RUNNING
        this.currentline = line
        this.errorline = ''
        // console.log('Line:', line)
        this.YX(X, Y)(size, bytes, Y)
      })
    },
    async backup () {
      this.error = null
      this.finished = false
      const { enqueued, start, oncespawn, sent, newphase, saved, stderr, oncedone } = this
      // this.dryrun = true
      return bKit(this.path, {
        // rsyncoptions: ['--dry-run'],
        enqueued,
        start,
        oncespawn,
        sent,
        newphase,
        saved,
        stderr,
        oncedone
      }).then(code => {
        console.log('Backup Done with code', code)
        if (this.isRunning) this.status = _DONE // Only in case other cases have not occurred
        const { path, endpoint } = this
        this.backupDone({ path, endpoint })
      }).catch(e => {
        if (this.isOnDequeuProcess) {
          console.info('Catch', e, 'on Dequeued Process for', this.path)
        } else if (this.isOnCancelProcess) {
          console.info('Catch', e, 'on Cancel Process for', this.path)
        } else {
          console.error('Backup catch error', e, 'for', this.path)
          this.error = e
          this.status = _ERROR
        }
      }).finally(() => {
        this.finished = true
        this.needBackup = 0
        this.lastRun = Date.now()
        this.waiting = undefined
        if (this.pid) killtree(this.pid)
        this.pid = undefined
      })
    },
    async beforeWindowUnload () {
      if (this.pid) await killtree(this.pid)
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
