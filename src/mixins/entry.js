const nameOf = {
  deleted: 'Was deleted',
  updated: 'Is update',
  nobackup: 'Not in backup',
  modified: 'Was modified'
}

export default {
  props: {
    entry: {
      type: Object,
      required: true
    }
  },
  computed: {
    isdir () { return this.entry.isdir },
    isfile () { return this.entry.isfile },
    status () {
      if (this.isUpdate) return 'updated'
      else if (this.needUpdate) return 'modified'
      else if (this.onlyLocal) return 'nobackup'
      else if (this.onlyBackup) return 'deleted'
      return undefined
    },
    description () { return nameOf[this.status] },
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
