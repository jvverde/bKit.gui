<template>
  <div>
    {{name}} v{{version}}
  </div>
</template>

<script>

import { ipcRenderer } from 'electron'
const app = ipcRenderer.sendSync('getApp')
export default {
  name: 'Info',
  data () {
    return app
  }
}
</script>

<style scoped lang="scss">
</style>
