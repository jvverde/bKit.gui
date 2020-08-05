<template>
  <form @submit.prevent="add" class="column items-start q-gutter-y-lg">
    <label>Add new server located at:</label>
    <q-input outlined dense clearable standout
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
      label="Server address">
      <template v-slot:append>
      </template>
    </q-input>
    <q-input type="number" max="65335" min="1"
      dense borderless
      class="self-end"
      v-model.number="port" label="Port Number">
    </q-input>
    <q-btn outline icon="add" label="Add" no-caps
      @click="add" :disable="error || adding"
      class="q-mt-sm self-center"
      color="green"/>
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
