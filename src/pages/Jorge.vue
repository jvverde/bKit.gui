<template>
  <q-page padding class="relative">
    Customize .....
    <q-select v-model="cor" :options="options" label="Nome" />

    Valor: <q-input filled v-model="valor" label="Valor em RGB" />

    <q-btn color="primary" label="change" @click="change"/>
    <q-badge color="ok">texto do ok</q-badge>
    <q-badge color="error">texto do error</q-badge>
  </q-page>
</template>

<script>

// import fs from 'fs'

import { colors } from 'quasar'

export default {
  name: 'Customize',
  data () {
    return {
      valor: '',
      cor: '',
      options: ['ok', 'error']
    }
  },
  methods: {
    change () {
      colors.setBrand(this.cor, this.valor)
      console.log(colors)
    }
  },
  async mounted () {
  }
}
</script>
