export default {
  props: {
    entry: {
      type: Object,
      required: true
    }
  },
  computed: {
    status () {
      if (this.isUpdate) return 'updated'
      else if (this.needUpdate) return 'modified'
      else if (this.onlyLocal) return 'nobackup'
      else if (this.onlyBackup) return 'deleted'
      return undefined
    },
    getcolor () {
      return this.status
    },
    path () {
      return this.entry.path
    },
    fullpath () {
      return this.entry.fullpath
    },
    name () {
      return this.entry.name
    },
    onbackup () {
      return !!this.entry.onbackup
    },
    onlocal () {
      return !!this.entry.onlocal
    },
    onlyBackup () { return this.entry.onlyBackup === true },
    // isfiltered () { return !!this.entry.isfiltered },
    onlyLocal () { return this.entry.onlyLocal === true },
    isUpdate () { return this.entry.updated === true },
    needUpdate () { return this.entry.needUpdate === true }
  }
}