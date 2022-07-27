import { _RUNNING } from './state'

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
      devices: new Counter()
    }
  },
  methods: {
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
    }
  }
}
