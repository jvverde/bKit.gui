<template>
  <q-page class="flex flex-center" style="height:100vh;width:100vw">
    <img alt="bKit logo" src="~assets/logotipo.svg" style="width:50%;height:50%;cursor:pointer" @click="go">
  </q-page>
</template>

<script>
export default {
  name: 'PageIndex',
  methods: {
    go () {
      this.$router.push('/restore')
    }
  }
}
</script>
