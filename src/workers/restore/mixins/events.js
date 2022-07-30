import {
  _DONE,
  _LAUNCHING,
  _STARTING
} from 'src/utils/states'

export default {
  // name: 'ComponentName',
  data () {
    return {
      currentline: '',
      cnterrors: 0
    }
  },
  methods: {
    onstart ({ pid }) {
      this.status = _STARTING
      this.pid = pid
      console.log(`Starting rKit [${pid}:${pid}]`)
    },
    oncespawn () {
      this.status = _LAUNCHING
    },
    stderr (line) {
      console.warn(line)
      this.currentline = line
      this.cnterrors++
    },
    onfinish () {
      this.status = _DONE
    }
  }
}
