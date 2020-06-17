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
        { label: 'ok', value: 'ok', color: 'ok' },
        { label: 'error', value: 'error', color: 'error' },
        { label: 'bkit', value: 'bkit', color: 'bkit' },
        { label: 'fg', value: 'fg', color: 'fg' },
        { label: 'bg', value: 'bg', color: 'brown' },
        { label: 'alarm', value: 'alarm', color: 'alarm' },
        { label: 'danger', value: 'danger', color: 'danger' },
        { label: 'warning', value: 'warning', color: 'warning' },
        { label: 'cancel', value: 'cancel', color: 'cancel' },
        { label: 'done', value: 'done', color: 'done' },
        { label: 'missing', value: 'missing', color: 'missing' },
        { label: 'active', value: 'active', color: 'active' },
        { label: 'updated', value: 'updated', color: 'updated' },
        { label: 'modified', value: 'modified', color: 'modified' },
        { label: 'new', value: 'new', color: 'new' },
        { label: 'nobackup', value: 'nobackup', color: 'nobackup' },
        { label: 'deleted', value: 'deleted', color: 'deleted' },
        { label: 'filtered', value: 'filtered', color: 'filtered' },
        { label: 'unchecked', value: 'unchecked', color: 'unchecked' },
        { label: 'included', value: 'included', color: 'included' },
        { label: 'excluded', value: 'excluded', color: 'excluded' },
        { label: 'folder', value: 'folder', color: 'folder' },
        { label: 'file', value: 'file', color: 'file' },
        { label: 'checkbox', value: 'checkbox', color: 'checkbox' },
        { label: 'button', value: 'button', color: 'button' },
        { label: 'backup', value: 'backup', color: 'backup' },
        { label: 'reset', value: 'reset', color: 'reset' },
        { label: 'restore', value: 'restore', color: 'restore' },
        { label: 'recover', value: 'recover', color: 'recover' },
        { label: 'loader', value: 'loader', color: 'loader' },
        { label: 'openclose', value: 'openclose', color: 'openclose' },
        { label: 'path', value: 'path', color: 'path' },
        { label: 'path-sep', value: 'path-sep', color: 'path-sep' },
        { label: 'selected', value: 'selected', color: 'selected' },
        { label: 'versions', value: 'versions', color: 'versions' },
        { label: 'noversions', value: 'noversions', color: 'noversions' },
        { label: 'badger', value: 'badger', color: 'badger' },
        { label: 'badger-1', value: 'badger-1', color: 'badger-1' },
        { label: 'badger-2', value: 'badger-2', color: 'badger-2' },
        { label: 'badger-3', value: 'badger-3', color: 'badger-3' },
        { label: 'chip', value: 'chip', color: 'chip' },
        { label: 'chip-1', value: 'chip-1', color: 'chip-1' },
        { label: 'chip-2', value: 'chip-2', color: 'chip-2' },
        { label: 'chip-3', value: 'chip-3', color: 'chip-3' },
        { label: 'console', value: 'console', color: 'console' },
        { label: 'console-border', value: 'console-border', color: 'console-border' }
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
