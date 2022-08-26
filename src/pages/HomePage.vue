<template>
  <q-page class="flex flex-center fit">
    <img alt="bKit logo" src="~assets/logotipo.svg" style="width:50%;height:50%;cursor:pointer" @click="go">
  </q-page>
</template>

<script>
export default {
  name: 'PageIndex',
  methods: {
    go () {
      this.$router.push('/backup')
    }
  },
  mounted () {
    // this.go()
  }
}
</script>
