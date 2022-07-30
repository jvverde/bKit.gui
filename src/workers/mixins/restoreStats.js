import { _RUNNING } from 'src/utils/states'

export default {
  // name: 'ComponentName',
  data () {
    return {
      totalfiles: 0,
      cntfiles: 0,
      totalsize: 0,
      currentpercent: 0,
      currentline: null,
      currentrate: '',
      currentsize: 0,
      currentsizeinbytes: 0
    }
  },
  computed: {
    filespercent () {
      return this.totalfiles ? Math.trunc(1000 * (this.cntfiles / this.totalfiles)) / 10 : 0
    },
    sizepercent () {
      return this.currentpercent
    }
  },
  methods: {
    initCounters () {
      this.totalfiles = this.totalsize = this.cntfiles = 0
    },
    onrecvfile ({ size }, line) {
      this.status = _RUNNING
      this.cntfiles++
      this.currentline = line
      this.currentsizeinbytes += Number(size)
    },
    onprogress ({ size, percent, rate }) {
      this.status = _RUNNING
      this.currentpercent = Number(percent)
      this.currentsize = size
      this.currentrate = rate
    },
    ontotalfiles (n) { this.totalfiles = Number(n) }, // Not fired without rsync '--delay-updates'
    ontotalsize (val) { this.totalsize = val }
  }
}
