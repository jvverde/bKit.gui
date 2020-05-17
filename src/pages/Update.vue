<template>
  <q-page padding class="relative">
    Update {{bKitPath}}
  </q-page>
</template>

<script>

import { ipcRenderer } from 'electron'
const bKitPath = ipcRenderer.sendSync('getbKitPath')

export default {
  name: 'Update',
  data () {
    return {
      bKitPath
    }
  },
  methods: {
    clone () {
      const git = require('simple-git')()
      git.pull('bKit-client', 'https://github.com/jvverde/bKit-gui.git', (...args) => {
        console.log(...args)
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
