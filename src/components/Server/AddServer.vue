<template>
  <form @submit.prevent="add" class="column items-end q-gutter-y-lg">
    <label class="self-start" style="margin-left:-2em">Add new server located at:</label>
    <q-input outlined dense clearable standout
      style="min-width:20em"
      @keyup.enter="add"
      @keydown.tab="add"
      type="text"
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
      v-model.number="port" label="Port Number">
    </q-input>
    <div class="q-gutter-x-xl self-center">
      <q-btn outline icon="cancel" label="Cancel" no-caps
        @click="cancel" color="red"/>
      <q-btn icon="add" label="Add" no-caps
        @click="add" :disable="error || adding"
        color="green"/>
    </div>
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
    },
    cancel () {
      this.$router.go(-1)
    }
  }
}
</script>
