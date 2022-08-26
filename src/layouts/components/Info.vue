<template>
  <div>
    {{name}} v{{version}}
  </div>
</template>

<script>

const app = window.electron.app

export default {
  name: 'Info',
  data () {
    return app
  }
}
</script>

<style scoped lang="scss">
</style>
