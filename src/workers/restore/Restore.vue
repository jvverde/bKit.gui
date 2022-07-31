<template>
  <q-item dense v-if="!deleted">
    <q-item-section>
      <q-item-label>
        <q-spinner-ios color="loader" v-if="isRunning"/>
        <q-icon name="check" color="done" v-if="isDone"/>
        <q-icon name="warning" color="warning" v-if="error">
          <tooltip :label="error"/>
        </q-icon>
        <span>{{status}} restore of {{path}}</span>
        <q-badge class="q-ml-xs shadow-1" color="badger" v-if="totalfiles">
          {{totalfiles}}
          <q-icon name="description" color="white" class="q-ml-xs"/>
          <tooltip label="Number of files"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="badger-1" v-if="isRunning && cntfiles">
          {{cntfiles}} of {{totalfiles}}
          <q-icon name="description" color="white" class="q-ml-xs"/>
          <tooltip label="Number of files so far"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="badger-2" v-if="totalsize">
          {{totalsize}}
          <tooltip label="Size of transferred files"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="badger-3" v-if="isRunning && currentsize">
          {{currentsize}}
          <tooltip label="Total size so far"/>
        </q-badge>
        <q-badge class="q-ml-sm shadow-1" color="badger-4" v-if="isRunning && currentrate">
          {{currentrate}}
          <tooltip label="Actual download rate"/>
        </q-badge>
      </q-item-label>
      <q-item-label caption v-if="isRunning && currentline">
        {{currentline}}
      </q-item-label>
    </q-item-section>
    <q-item-section side v-if="isRunning">
      <q-circular-progress
        show-value
        font-size="9px"
        :value="sizepercent"
        size="55px"
        :thickness="0.22"
        color="bkit"
        track-color="yellow-1"
        class="q-ma-md">
        {{ sizepercent }}% size
      </q-circular-progress>
    </q-item-section>
    <q-item-section side v-if="isRunning">
      <q-circular-progress
        show-value
        font-size="9px"
        :value="filespercent"
        size="55px"
        :thickness="0.22"
        color="bkit"
        track-color="yellow-1"
        class="q-ma-md">
        {{ filespercent }}% files
      </q-circular-progress>
    </q-item-section>
    <q-item-section side v-if="isDryRun">[DRY-RUN]</q-item-section>
    <q-item-section side v-if="isDismissible">
      <q-btn flat round icon="close" color="dismmiss" size="xs" @click.stop="deleted = true"/>
    </q-item-section>
    <q-item-section side v-if="isCancelable">
      <q-btn flat round icon="stop" color="cancel" size="xs" @click.stop="cancel"/>
    </q-item-section>
  </q-item>
</template>

<script>
import { rKit } from 'src/helpers/bkit'
import { Resource } from 'src/helpers/types'
import { formatBytes } from 'src/utils/misc'
import { killtree } from 'src/helpers/bash'
import { error } from 'src/helpers/notify'

import tooltip from 'src/components/tooltip'

import { _CANCELREQUEST, _CANCELED, _DONE, _ERROR } from 'src/utils/states'
import state from '../mixins/state'
import events from '../mixins/restoreEvents'
import stats from '../mixins/restoreStats'

const isDryRun = (element) => element.match(/^--dry-run/) instanceof Array
export default {
  name: 'Restore',
  data () {
    return {
      finished: false,
      deleted: false
    }
  },
  components: {
    tooltip
  },
  mixins: [state, events, stats],
  computed: {
    path () {
      return this.resource.path
    },
    isFinished () {
      return this.finished === true
    },
    isDryRun () {
      return this.resource.rsyncoptions.some(isDryRun) || this.resource.options.some(isDryRun)
    }
  },
  props: {
    resource: {
      type: Resource,
      required: true
    },
    done: {
      type: Function,
      default: () => console.log('NO DONE CALL BACK')
    }
  },
  methods: {
    formatBytes,
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
    destroy () {
      this.$emit('destroy')
    },
    restore () {
      this.initCounters()
      this.error = null
      console.log('resource', this.resource)
      const { path, options: o, rsyncoptions: r, snap, rvid } = this.resource
      const options = [...o] // Resource came from VUEX and shoudn't be modified outside a mutation
      const rsyncoptions = [...r, '--delay-updates']
      options.push(
        `--snap=${snap}`,
        `--rvid=${rvid}`
      )
      const { enqueued, onstart, oncespawn, stderr, onfinish, onrecvfile, onprogress, ontotalfiles, ontotalsize } = this
      rKit(path, options, rsyncoptions, {
        enqueued,
        onstart,
        oncespawn,
        stderr,
        onfinish,
        onrecvfile,
        onprogress,
        ontotalfiles,
        ontotalsize
      }).then(code => {
        console.log('Restore Done with code', code)
        if (this.isRunning) this.status = _DONE // Only in case other cases have not occurred
        this.done(this.path)
      }).catch(e => {
        if (this.isOnDequeuProcess) {
          console.info('Catch', e, 'on Dequeued Process for', this.path)
        } else if (this.isOnCancelProcess) {
          console.info('Catch', e, 'on Cancel Process for', this.path)
        } else {
          console.error('Restore catch error', e, 'for', this.path)
          this.error = e
          this.status = _ERROR
        }
      }).finally(() => {
        this.finished = true
        if (this.pid) killtree(this.pid)
        this.pid = undefined
      })
    }
  },
  mounted () {
    this.restore()
  }
}
</script>
