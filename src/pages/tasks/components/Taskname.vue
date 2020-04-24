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
          size="xs" color="positive"/>
      </template>
      <template v-slot:after>
        <q-icon  v-if="invalid" name="warning" flat color="negative"/>
        <q-icon  v-else-if="valid" name="done" flat color="positive"/>
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
      task.get('BKIT-' + this.value, 'LIST')
        .then(list => {
          console.log('Tasks exists', list)
          this.invalid = true
        }).catch(e => {
          this.invalid = false
          this.valid = true
          this.$emit('update:name', this.value)
        })
    }
  }
}
</script>

<test lang="jest">
  import { mount } from '@vue/test-utils'
  import TaskName from '../Taskname'

  describe('TaskName.vue', () => {
    it('renders a takname', () => {

    })
  })
</test>
