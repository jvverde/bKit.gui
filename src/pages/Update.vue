<template>
  <q-page padding class="relative">
    Update {{bKitPath}}
    <q-btn icon="system_update_alt" label="Clone" @click="clone" :loading="loading"/>
    <q-btn icon="folder" label="New bkit Location" @click="setbkitLocation"/>
  </q-page>
</template>

<script>

const { ipcRenderer, remote: { app, dialog } } = require('electron')
const path = require('path')
const bKitPath = ipcRenderer.sendSync('getbKitPath')

export default {
  name: 'Update',
  data () {
    return {
      loading: false,
      bKitPath
    }
  },
  watch: {
    bKitPath (val) {
      console.log('set bkit at', val)
      ipcRenderer.send('setbKitPath', val)
    }
  },
  methods: {
    setbkitLocation () {
      const dst = path.normalize(path.join(app.getAppPath(), '../'))
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
      const dst = bKitPath
      const git = require('simple-git')(dst)
      git.silent(false)
      console.log('clone', git)
      this.loading = true
      git.clone('https://github.com/jvverde/bKit.git', dst, (...args) => {
        console.log(...args)
        this.loading = false
        ipcRenderer.send('setbKitPath', dst)
      })
    },
    pull () {
      const git = require('simple-git')(bKitPath)
      git.pull('public', 'master', (...args) => {
        console.log(...args)
      })
    }
  }
}
</script>
