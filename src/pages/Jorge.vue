<template>
  <q-page padding class="relative">
  <Photoshop v-model="colors" v-if="chooseop === 'Photoshop'"/>
  <Material v-model="colors" v-if="chooseop === 'Material'"/>
  <Chrome v-model="colors" v-if="chooseop === 'Chrome'"/>
  <Compact v-model="colors" v-if="chooseop === 'Compact'"/>
  <Sketch v-model="colors" v-if="chooseop === 'Sketch'"/>
  <Slider v-model="colors" v-if="chooseop === 'Slider'"/>
   Customize .....
    <q-select v-model="chooseop" :options="choose" label="Escolha" />
    <q-select v-model="cor" :options="options" label="Nome" />
    <q-btn color="primary" label="change" @click="change"/>
    <q-badge color="ok">texto do ok</q-badge>
    <q-badge color="error">texto do error</q-badge>>
  </q-page>
</template>

<script>

// import fs from 'fs'

import { colors } from 'quasar'
import { Photoshop, Material, Chrome, Compact, Sketch, Slider } from 'vue-color'

export default {
  name: 'Customize',
  data () {
    return {
      colors: '',
      valor: '',
      cor: 'ok',
      options: ['ok', 'error'],
      chooseop: '',
      choose: ['Chrome', 'Compact', 'Material', 'Photoshop', 'Sketch', 'Slider']
    }
  },
  components: {
    Photoshop: Photoshop,
    Material: Material,
    Chrome: Chrome,
    Compact: Compact,
    Sketch: Sketch,
    Slider: Slider
  },
  methods: {
    change () {
      console.log('colors', this.colors)
      colors.setBrand(this.cor, this.colors.hex)
    }
  },
  async mounted () {
  }
}
</script>
