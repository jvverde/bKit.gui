const nameOf = {
  deleted: 'Was deleted',
  updated: 'Is update',
  nobackup: 'Not in backup',
  modified: 'Was modified'
}

import { mapGetters, mapMutations } from 'vuex'

export default {
  props: {
    entry: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapGetters('backup', ['isQueued']),
    ...mapGetters('snaps', ['isLastSnap']),
    isdir () { return this.entry.isdir },
    isfile () { return this.entry.isfile },
    status () {
      if (this.isUpdate) return 'updated'
      else if (this.onlyLocal) return 'nobackup'
      else if (this.onlyBackup) return 'deleted'
      else if (this.needUpdate) return 'modified'
      return undefined
    },
    description () { return nameOf[this.status] },
    getcolor () {
      return this.status === 'updated' && !this.isLastSnap ? 'older' : this.status
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
    needUpdate () { return this.entry.needUpdate === true },
    isBackupable () { return this.onlyLocal || this.needUpdate },
    onBackupQueue () { return this.isQueued(this.fullpath) },
    showBackup () { return this.isLastSnap && this.isBackupable && !this.onBackupQueue }
  },
  methods: {
    ...mapMutations('backup', ['add2backup']),
    backup () {
      this.add2backup(this.fullpath)
    }
  }
}
