import { error } from 'src/helpers/notify'
import { killtree } from 'src/helpers/bash'

import {
  _CANCELED,
  _CANCELREQUEST,
  _DEQUEUED,
  _DEQUEUING,
  _DONE,
  _ENQUEUED,
  _ERROR,
  // _LAUNCHING,
  _RUNNING,
  _STARTING
} from 'src/utils/states'

const nill = () => null

export default {
  name: 'Backup',
  data () {
    return {
      pid: undefined,
      status: undefined,
      error: null,
      dequeued: nill
    }
  },
  computed: {
    isIdle () {
      return this.isFinished || this.status === undefined
    },
    isStarting () {
      return this.status === _STARTING
    },
    isRunning () {
      return this.status === _RUNNING && !this.isFinished
    },
    isDone () {
      return this.status === _DONE && this.isFinished
    },
    isCanceled () {
      return this.status === _CANCELED || this.status === _DEQUEUED
    },
    isCanceling () {
      return this.status === _CANCELREQUEST
    },
    isOnCancelProcess () {
      return this.isCanceling || this.isCanceled
    },
    isCancelable () {
      return this.status && !this.isDone && !this.isCanceled && !this.isOnError
    },
    isDismissible () {
      return this.isDone || this.isCanceled
    },
    isStopped () {
      return this.isCanceled || this.isFinished
    },
    isRemovable () {
      return this.status && this.isStopped
    },
    onQueue () {
      return this.status === _ENQUEUED
    },
    isDequeued () {
      return this.status === _DEQUEUED
    },
    isDequeuing () {
      return this.status === _DEQUEUING
    },
    isOnDequeuProcess () {
      return this.isDequeued || this.isDequeuing
    },
    isDryRun () {
      return this.status && this.dryrun
    },
    isOnError () {
      return this.status === _ERROR
    }
  },
  methods: {
    enqueued (item) {
      this.status = _ENQUEUED
      console.log(_ENQUEUED)
      this.dequeued = () => {
        this.status = _DEQUEUING
        console.log(_DEQUEUING)
        try {
          item.dismiss()
          this.dequeued = nill
          this.status = _DEQUEUED
          console.log(_DEQUEUED)
        } catch (err) {
          error(err)
        }
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
    async beforeWindowUnload () {
      if (this.pid) await killtree(this.pid)
    }
  },
  mounted () {
    window.addEventListener('beforeunload', this.beforeWindowUnload)
  },
  beforeDestroy () {
    window.removeEventListener('beforeunload', this.beforeWindowUnload)
  }
}
