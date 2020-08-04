<template>
  <form @submit.prevent="add" class="column items-stretch">
    <q-input rounded outlined dense clearable
      @keyup.enter="add"
      @keydown.tab="add"
      type="url"
      v-model="address"
      :loading="adding"
      :error="!!error"
      :error-message="`Server '${address}' not found`"
      @clear="error=false"
      placeholder="IP Address or Server Name"
      hint="Address of a bKit server"
      label="Add Server">
      <template v-slot:append>
        <q-btn outline icon="add" no-caps stack
          @click="add"
          v-if="!error && !adding"
          size="xs"
          round
          color="green"/>
      </template>
    </q-input>
    <q-input type="number" max="65335" min="1"
      rounded outlined dense
      v-model.number="port" label="Port Number">
    </q-input>
  </form>
</template>

<script>
import { changeServer } from 'src/helpers/bkit'
import { warn } from 'src/helpers/notify'

export default {
  name: 'Servers',
  data () {
    return {
      address: undefined,
      port: 8765,
      adding: false,
      error: false
    }
  },
  methods: {
    add () {
      if (!this.address) return
      this.error = null
      this.adding = true
      changeServer(this.address)
        .then(() => this.$emit('done', this.address))
        .catch(err => {
          this.error = err
          warn(err)
        })
        .finally(() => {
          this.adding = false
        })
    }
  }
}
</script>
