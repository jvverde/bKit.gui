<template>
  <q-page padding class="relative">
    <div style="with:100%; text-align:center">
      On this page you may customize the colors used by the bKit GUI
    </div>
    <q-select v-model="chooseop" :options="choose"
      style="max-width: 18em"
      label="If you want you may switch to another pickup color" />

    <div class="row no-wrap items-center q-mt-lg">
      <div style="min-width:40%" class="row items-center justify-center">
        <Photoshop v-model="color" v-if="chooseop === 'Photoshop'"/>
        <Material v-model="color" v-if="chooseop === 'Material'"/>
        <Chrome v-model="color" v-if="chooseop === 'Chrome'"/>
        <Compact v-model="color" v-if="chooseop === 'Compact'"/>
        <Sketch v-model="color" v-if="chooseop === 'Sketch'"/>
        <Slider v-model="color" v-if="chooseop === 'Slider'"/>
      </div>
      <q-option-group :options="options"
        size="xs"
        class="q-pa-md q-ml-lg"
        label="Select the color that you want to change"
        inline dense type="radio" v-model="group" />
    </div>
    <div>
      <q-btn v-for="option in options" :key="option.value"
        :label="option.value"
        @click="setcolor(option.value)"
        dense
        :color="option.color"/>
    </div>
    <q-btn color="primary" label="change" @click="change"/>
    <q-badge color="ok">texto do ok</q-badge>
    <q-badge color="error">texto do error</q-badge>
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
      chooseop: 'Photoshop',
      cores: ['ok', 'error'],
      group: 'ok',
      options: [
        { label: 'ok', value: 'ok' },
        { label: 'error', value: 'error', color: 'green' },
        { label: 'bkit', value: 'bkit', color: 'orange' },
        { label: 'fg', value: 'fg', color: 'blue' },
        { label: 'bg', value: 'bg', color: 'brown' },
        { label: 'alarm', value: 'alarm', color: 'red' },
        { label: 'danger', value: 'danger', color: 'purple' },
        { label: 'warning', value: 'warning', color: 'yellow' },
        { label: 'cancel', value: 'cancel', color: 'black' },
        { label: 'done', value: 'done', color: 'grey' },
        { label: 'missing', value: 'missing', color: 'missing' },
        { label: 'active', value: 'active', color: 'green' },
        { label: 'updated', value: 'updated', color: 'orange' },
        { label: 'modified', value: 'modified', color: 'blue' },
        { label: 'new', value: 'new', color: 'brown' },
        { label: 'nobackup', value: 'nobackup', color: 'red' },
        { label: 'deleted', value: 'deleted', color: 'purple' },
        { label: 'filtered', value: 'filtered', color: 'yellow' },
        { label: 'unchecked', value: 'unchecked', color: 'black' },
        { label: 'included', value: 'included', color: 'grey' },
        { label: 'excluded', value: 'excluded', color: 'white' },
        { label: 'folder', value: 'folder', color: 'green' },
        { label: 'file', value: 'file', color: 'orange' },
        { label: 'checkbox', value: 'checkbox', color: 'blue' },
        { label: 'button', value: 'button', color: 'brown' },
        { label: 'backup', value: 'backup', color: 'red' },
        { label: 'reset', value: 'reset', color: 'purple' },
        { label: 'restore', value: 'restore', color: 'yellow' },
        { label: 'recover', value: 'recover', color: 'black' },
        { label: 'loader', value: 'loader', color: 'grey' },
        { label: 'openclose', value: 'openclose', color: 'white' },
        { label: 'path', value: 'path', color: 'green' },
        { label: 'path-sep', value: 'path-sep', color: 'orange' },
        { label: 'selected', value: 'selected', color: 'blue' },
        { label: 'versions', value: 'versions', color: 'brown' },
        { label: 'noversions', value: 'noversions', color: 'red' },
        { label: 'badger', value: 'badger', color: 'purple' },
        { label: 'badger-1', value: 'badger-1', color: 'yellow' },
        { label: 'badger-2', value: 'badger-2', color: 'black' },
        { label: 'badger-3', value: 'badger-3', color: 'grey' },
        { label: 'chip', value: 'chip', color: 'white' },
        { label: 'chip-1', value: 'chip-1', color: 'green' },
        { label: 'chip-2', value: 'chip-2', color: 'orange' },
        { label: 'chip-3', value: 'chip-3', color: 'blue' },
        { label: 'console', value: 'console', color: 'brown' },
        { label: 'console-border', value: 'console-border', color: 'red' }
      ],
      choose: [
        'Chrome',
        'Compact',
        'Material',
        'Photoshop',
        'Sketch',
        'Slider'
      ]
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
      colors.setBrand(this.group, this.color.hex)
    },
    setcolor (val) {
      this.group = val
    }
  },
  async mounted () {
  }
}
</script>
