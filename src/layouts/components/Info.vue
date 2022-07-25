<template>
  <div>
    {{name}} v{{version}}
  </div>
</template>

<script>
const { remote: { app } } = require('electron')

export default {
  name: 'Info',
  data () {
    return {
      version: app.getVersion(),
      name: app.getName()
    }
  }
}
</script>

<style scoped lang="scss">
</style>
