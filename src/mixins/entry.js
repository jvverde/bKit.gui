import { relative, normalize } from 'path'

const nameOf = {
  deleted: 'Was deleted',
  updated: 'Is update',
  nobackup: 'Not in backup',
  modified: 'Was modified'
}

const bkitPath = (base, path, isdir = true) => {
  let upath = base ? relative(base, path) : path
  upath = isdir ? `/${upath}/` : `/${upath}`
  return normalize(upath)
}

import { mapGetters, mapMutations } from 'vuex'
import { Resource } from 'src/helpers/types'

const { dialog, app } = require('electron').remote
let download = app.getPath('downloads') || app.getPath('temp')

export default {
  props: {
    entry: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapGetters('backups', ['isQueued']),
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
    isForbidden () {
      return this.entry.err !== undefined
    },
    onlyBackup () { return this.entry.onlyBackup === true },
    // isfiltered () { return !!this.entry.isfiltered },
    onlyLocal () { return this.entry.onlyLocal === true },
    isUpdate () { return this.entry.updated === true },
    needUpdate () { return this.entry.needUpdate === true },
    isBackupable () { return this.onlyLocal || this.needUpdate },
    onBackupQueue () { return this.isQueued(this.fullpath) },
    showBackup () { return this.isLastSnap && this.isBackupable && !this.onBackupQueue },
    isRestorable () { return (this.needUpdate || this.onlyBackup) && this.mountpoint },
    isRecoverable () { return this.onbackup },
    snap () { return this.entry.snap },
    rvid () { return this.entry.rvid },
    mountpoint () { return this.entry.mountpoint },
    node () { return this.entry }
    // node () {
    //   const { path, snap, rvid, mountpoint } = this.entry
    //   return { path, snap, rvid, mountpoint }
    // }
  },
  methods: {
    ...mapMutations('backups', ['add2backup']),
    ...mapMutations('restore', ['add2restore']),
    backup () {
      this.add2backup(this.fullpath)
    },
    restore () {
      let { path, snap, rvid, mountpoint, isdir } = this
      if (!mountpoint) path = bkitPath('', path, isdir)
      // const rsyncoptions = ['--no-p', '--no-g', '--chmod=ugo=rwX']
      this.add2restore(new Resource({ path, snap, rvid }))
    },
    recover () {
      let { path, name, snap, rvid, mountpoint, isdir } = this
      path = bkitPath(mountpoint, path, isdir)
      dialog.showOpenDialog({
        title: 'Where do you want to recover your data',
        defaultPath: download,
        buttonLabel: 'Recover to here',
        properties: ['openDirectory', 'promptToCreate']
      }).then((result) => {
        if (result.filePaths instanceof Array) {
          download = result.filePaths[0]
          if (download !== null) {
            const dir = isdir ? `/${name}/` : ''
            // --no-p --no-g --chmod=ugo=rwX
            const options = [`--dst=${download}${dir}`]
            // const rsyncoptions = ['--no-p', '--no-g', '--chmod=ugo=rwX']
            this.add2restore(new Resource({ path, snap, rvid, options }))
          }
        }
      }).catch((err) => {
        download = null
        console.error('Catch on showOpenDialog', err)
      }).finally(() => {
        // console.log('')
      })
    }
  }
}
