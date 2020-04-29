<template>
  <div class="column no-wrap items-center">
    <q-input
      class="q-mt-lg"
      v-model="value"
      prefix="BKIT-"
      outlined
      dense
      label="Taskname"
      hint="Choose a name not yet listed"
      @keyup.enter="check"
      @keydown.tab="check"
      @blur="check"
      @keydown="valid = invalid = false"
      type="text">
      <template v-slot:append>
        <q-btn flat no-caps stack round
          icon="add"
          @click="check"
          size="xs" color="button"/>
      </template>
      <template v-slot:after>
        <q-icon v-if="invalid" name="warning" flat color="error"/>
        <q-icon v-else-if="valid" name="done" flat color="ok"/>
      </template>
    </q-input>
  </div>
</template>

<script>

const task = require('windows-scheduler')

export default {
  name: 'taskname',
  data () {
    return {
      value: '',
      invalid: false,
      valid: false
    }
  },
  props: ['name'],
  methods: {
    check () {
      if (!this.value) return
      task.get('BKIT-' + this.value, 'LIST')
        .then(list => {
          console.log('Not good. Tasks exists', list)
          this.invalid = true
        }).catch(e => {
          console.log('Its ok! Tasks not exists')
          this.invalid = false
          this.valid = true
          this.$emit('update:name', this.value)
        })
    }
  }
}
</script>
