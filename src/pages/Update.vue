<template>
  <q-page padding class="relative">
    <div>bKitPath: {{bKitPath}}</div>
    <q-btn icon="system_update_alt" label="Clone" @click="clone" :loading="loading"/>
    <q-btn icon="folder" label="New bkit Location" @click="chosebkitLocation"/>
    <div v-if="!bkitinstalled">bKit client is not installed on this location. I must clone it from repository</div>
    <div v-else>bKit client is installed</div>
  </q-page>
</template>

<script>

import { mapGetters, mapMutations } from 'vuex'

const { remote: { app, dialog } } = require('electron')
const path = require('path')
const isWin = process.platform === 'win32'

export default {
  name: 'Update',
  data () {
    return {
      isWin,
      loading: false
    }
  },
  computed: {
    ...mapGetters('global', ['bkitlocation', 'bkitinstalled', 'bkitok']),
    bKitPath: {
      get () { return this.bkitlocation },
      set (val) { this.setbkitLocation(val) }
    },
    needCheck () {
      return this.bkitinstalled ? this.bkitlocation : false
    },
    needInstall () {
      return !this.bkitok
    }
  },
  watch: {
    needCheck (val) {
      if (val) {
        console.log('bkitisok?', this.bkitok)
      }
    }
  },
  methods: {
    ...mapMutations('global', ['setbkitLocation', 'checkbkitInstalled']),
    chosebkitLocation () {
      const dst = this.bKitPath || path.normalize(path.join(app.getAppPath(), '../'))
      console.log('dst', dst)
      let location = null
      dialog.showOpenDialog({
        title: 'Select a new location for bKit client',
        defaultPath: dst,
        buttonLabel: 'Choose',
        properties: ['openDirectory', 'promptToCreate']
      }).then((result) => {
        if (result.filePaths instanceof Array) {
          location = result.filePaths[0]
          if (location !== null) {
            this.bKitPath = location
          }
        }
      }).catch((err) => {
        console.error('Catch on showOpenDialog', err)
      }).finally(() => {
        // console.log('')
      })
    },
    clone () {
      const dst = this.bKitPath
      const git = require('simple-git')(dst)
      git.silent(false)
      console.log('clone to', dst)
      this.loading = true
      git.clone('https://github.com/jvverde/bKit.git', dst, (...args) => {
        console.log(...args)
        this.loading = false
        this.checkbkitInstalled()
      })
    },
    pull () {
      const git = require('simple-git')(this.bKitPath)
      git.pull('public', 'master', (...args) => {
        console.log(...args)
      })
    },
    setup () {
      if (isWin) {

      }
    }
  }
}
</script>
