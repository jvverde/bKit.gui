<template>
  <div class="column no-wrap items-center">
    <div class="q-mt-lg q-gutter-sm row items-center no-wrap">
      <q-input
        v-model.number="_freq"
        maxlength="2"
        outlined
        dense
        label="Every"
        style="max-width:7em;min-width:5em"
        type="number"/>
      <q-option-group
        v-model="_period"
        :options="periods"
        color="positive"
        inline
        dense
      />
    </div>
    <div class="q-mt-lg q-gutter-sm row items-center no-wrap">
      <span>Start at</span>
      <q-input v-model="_start" dense outlined type="time"/>
    </div>
  </div>
</template>

<script>

export default {
  name: 'schedule',
  props: {
    freq: {
      type: Number,
      default: 1
    },
    period: {
      type: String
    },
    periods: {
      type: Array,
      default: () => []
    },
    start: {
      type: String
    }
  },
  computed: {
    _freq: {
      get () { return this.freq },
      set (val) { return this.$emit('update:freq', val) }
    },
    _period: {
      get () { return this.period },
      set (val) { return this.$emit('update:period', val) }
    },
    _start: {
      get () { return this.start },
      set (val) { return this.$emit('update:start', val) }
    }
  }
}
</script>
