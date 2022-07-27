import { error } from 'src/helpers/notify'

export const _CANCELREQUEST = 'Cancel Request'
export const _DONE = 'Done'
export const _CANCELED = 'Canceled'
export const _ERROR = 'Error'
const _ENQUEUED = 'Enqueued'
const _STARTING = 'Starting'
export const _RUNNING = 'Running'
const _DEQUEUED = 'Dequeued'
const _LAUNCHING = 'Launching'
const _DEQUEUING = 'Dequeuing'

const nill = () => null

export default {
  name: 'Backup',
  data () {
    return {
      pid: undefined,
      phase: undefined,
      phasemsg: '',
      status: undefined,
      error: null,
      cnterrors: 0,
      currentline: '',
      errorline: '',
      dequeued: nill,
      dryrun: false
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
    onQueue () {
      return this.status === _ENQUEUED
    },
    isDequeued () {
      return this.status === _DEQUEUED
    },
    isCancelable () {
      return this.status && !this.isDone && !this.isCanceled && !this.isOnError
    },
    isDryRun () {
      return this.status && this.dryrun
    },
    isStopped () {
      return this.isCanceled || this.isFinished
    },
    isRemovable () {
      return this.status && this.isStopped
    },
    isOnError () {
      return this.status === _ERROR
    },
    isCanceling () {
      return this.status === _CANCELREQUEST
    },
    isOnCancelProcess () {
      return this.isCanceling || this.isCanceled
    },
    isDequeuing () {
      return this.status === _DEQUEUING
    },
    isOnDequeuProcess () {
      return this.isDequeued || this.isDequeuing
    }
  },
  methods: {
    /* Called by events */
    newphase ({ phase, msg }) {
      console.log('Phase', phase, msg)
      this.status = _RUNNING
      this.phase = 0 | phase
      this.phasemsg = msg
      this.currentline = ''
    },
    saved (endpoint) {
      console.log('Your data is saved on', endpoint)
    },
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
    start ({ pid }) {
      this.status = _STARTING
      this.pid = pid
      console.log(`Starting with pid ${pid}`)
    },
    stderr (line) {
      console.warn(line)
      this.errorline = line
      this.currentline = ''
      this.cnterrors++
    },
    oncedone (code) {
      console.log('Done bKit with code', code)
      if (code === 0) this.status = _DONE
      this.phase = undefined
      this.currentline = ''
    },
    oncespawn (fd) {
      console.log(_LAUNCHING, fd)
      this.status = _LAUNCHING
    }
    /* Set by uper layer action */

  }
}
