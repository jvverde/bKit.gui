<template>
  <q-page padding class="relative">
    Update {{bKitPath}}
    <q-btn icon="system_update_alt" label="Clone" @click="clone" :loading="loading"/>
    <q-btn icon="folder" label="New bkit Location" @click="chosebkitLocation"/>
    <span v-if="!bkitinstalled">bKit client is not installed on this location. I must clone it from repository</span>
    <span v-else>bKit client is installed</span>
  </q-page>
</template>

<script>

import { mapGetters, mapMutations } from 'vuex'
import { bkitping } from 'src/helpers/bash'

const { remote: { app, dialog } } = require('electron')
const path = require('path')

export default {
  name: 'Update',
  data () {
    return {
      loading: false
    }
  },
  computed: {
    ...mapGetters('global', ['bkitlocation', 'bkitinstalled']),
    bKitPath: {
      get () { return this.bkitlocation },
      set (val) { this.setbkitLocation(val) }
    },
    needCheck () {
      return this.bkitinstalled ? this.bkitlocation : false
    }
  },
  watch: {
    needCheck (val) {
      if (val) {
        console.log('Ping bkit')
        try {
          const pong = bkitping('aquiiiiii')
          console.log('pong', pong)
        } catch {
          console.warn('Bkit is not running yet on this location')
        }
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
    }
  }
}
</script>
