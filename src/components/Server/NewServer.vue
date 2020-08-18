<template>
  <div class="fit relative-position">
    <form @submit.prevent="add" class="column items-end q-gutter-y-lg absolute-center">
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
        <q-btn icon="add" label="Add" no-caps
          @click="add" :disable="error || adding"
          color="green"/>
      </div>
    </form>
    <q-btn class="absolute-top-right" flat round icon="cancel" @click="cancel" color="red" size="sm" />
  </div>
</template>

<script>
import axios from 'axios'
// import { changeServer } from 'src/helpers/bkit'
import { warn } from 'src/helpers/notify'
import { mapMutations } from 'vuex'

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
    // add () {
    //   if (!this.address) return
    //   this.error = null
    //   this.adding = true
    //   changeServer(this.address)
    //     .then(() => this.$emit('done', this.address))
    //     .catch(err => {
    //       this.error = err
    //       warn(err)
    //     })
    //     .finally(() => {
    //       this.adding = false
    //     })
    // },
    ...mapMutations('global', ['addServer']),
    async add () {
      const url = `http://${this.address}:${this.port}/info`
      try {
        this.adding = true
        const { data } = await axios.get(url)
        console.log('data', data)
        const server = {
          address: this.address,
          user: undefined,
          hport: this.port,
          iport: data.iport,
          bport: data.bport
        }
        this.addServer(server)
      } catch (err) {
        warn(err)
      } finally {
        this.adding = false
      }
    },
    cancel () {
      this.$router.back()
    }
  }
}
</script>
