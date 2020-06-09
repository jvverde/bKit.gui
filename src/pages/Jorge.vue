<template>
  <q-page padding class="relative">
  <Photoshop v-model="color" v-if="chooseop === 'Photoshop'"/>
  <Material v-model="color" v-if="chooseop === 'Material'"/>
  <Chrome v-model="color" v-if="chooseop === 'Chrome'"/>
  <Compact v-model="color" v-if="chooseop === 'Compact'"/>
  <Sketch v-model="color" v-if="chooseop === 'Sketch'"/>
  <Slider v-model="color" v-if="chooseop === 'Slider'"/>
   Customize .....
    <q-select v-model="chooseop" :options="choose" label="Escolha" />

     <q-option-group
      :options="options"
      label="colors"
      type="radio"
      v-model="group"
    />
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
      color: '',
      valor: '',
      cor: 'ok',
      chooseop: '',
      cores: ['ok', 'error'],
      group: 'ok',
      options: [
        { label: 'ok', value: 'ok' },
        { label: 'error', value: 'error', color: 'green' }
        { label: 'error', value: 'error', color: 'green' }
        { label: 'error', value: 'error', color: 'green' }
        { label: 'error', value: 'error', color: 'green' }
        { label: 'error', value: 'error', color: 'green' }
        { label: 'error', value: 'error', color: 'green' }
        { label: 'error', value: 'error', color: 'green' }
        { label: 'error', value: 'error', color: 'green' }
      ],
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
      console.log('color', this.color)
      colors.setBrand(this.cor, this.color.hex)
    }
  },
  async mounted () {
  }
}
</script>
