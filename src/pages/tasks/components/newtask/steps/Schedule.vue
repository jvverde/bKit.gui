<template>
  <div class="column no-wrap items-center">
    <div class="q-mt-lg q-gutter-sm row items-center no-wrap">
      <q-input
        v-model.number="freq"
        maxlength="2"
        outlined
        dense
        label="Every"
        style="max-width:8em;min-width:5em"
        type="number"/>
      <q-option-group
        v-model="period"
        :options="options"
        color="bkit"
        inline
        dense
      />
    </div>
    <div class="q-mt-lg q-gutter-sm row items-center no-wrap">
      <span>Start at</span>
      <q-input v-model="start" dense outlined type="time"/>
    </div>
  </div>
</template>

<script>
import Scheduler from 'src/helpers/scheduler'
export default {
  name: 'schedule',
  props: {
    scheduler: {
      type: Scheduler,
      required: true
    }
  },
  computed: {
    freq: {
      get () { return this.scheduler.freq },
      set (val) { this.scheduler.freq = val }
    },
    period: {
      get () { return this.scheduler.period },
      set (val) { this.scheduler.period = val }
    },
    start: {
      get () { return this.scheduler.start },
      set (val) { this.scheduler.start = val }
    },
    options () {
      return this.scheduler.options()
    }
  }
}
</script>
