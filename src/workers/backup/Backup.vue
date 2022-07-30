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
import { formatBytes } from 'src/utils/misc'
import tooltip from 'src/components/tooltip'
import { mapMutations } from 'vuex'
import { chokidar, chokidarOptions } from 'src/helpers/chockidar'
import events from './mixins/events'
import state from 'src/workers/mixins/state'
import { _DONE, _ERROR } from 'src/utils/states'
import stats from './mixins/stats'

const depth = 20
const watchOptions = { ...chokidarOptions, depth }

const _DELTA = 300000 // 5min

export default {
  name: 'Backup',
  data () {
    return {
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
  mixins: [state, events, stats],
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
