import { _DONE, _RUNNING, _STARTING, _LAUNCHING } from 'src/utils/states'

export default {
  name: 'Backup',
  data () {
    return {
      phase: undefined,
      phasemsg: '',
      cnterrors: 0,
      currentline: '',
      errorline: ''
    }
  },
  computed: {
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
