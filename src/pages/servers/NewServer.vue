<template>
  <div class="fit relative-position">
    <form @submit.prevent="add" class="column items-end q-gutter-y-lg absolute-center">
      <label class="self-start" style="margin-left:-2em">Add new server located at:</label>
      <div class="row no-wrap q-gutter-x-lg">
        <div>
          <q-btn-toggle v-model="protocol" spread no-caps toggle-color="green-9" color="grey" text-color="white"
            :options="[
              {label: 'https', value: 'https'},
              {label: 'http', value: 'http'}
            ]"
          />
        </div>
        <q-input outlined dense clearable standout
          style="min-width:20em"
          autofocus
          @keyup.enter="add"
          @keydown.tab="add"
          type="text"
          v-model="servername"
          :loading="adding"
          :error="!!error"
          :error-message="`Server '${servername}' not found`"
          @clear="error=false"
          placeholder="IP Address or Server Name"
          hint="Address of a bKit server"
          label="Server address">
          <template v-slot:append>
          </template>
        </q-input>
      </div>
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
import { mapActions } from 'vuex'

export default {
  name: 'Servers',
  data () {
    return {
      servername: undefined,
      protocol: 'https',
      setport: undefined,
      adding: false,
      error: false
    }
  },
  computed: {
    port: {
      get () { return this.setport ? this.setport : this.protocol === 'https' ? 8766 : 8765 },
      set (port) { this.setport = port }
    }
  },
  methods: {
    ...mapActions('servers', ['addServer']),
    async add () {
      if (!this.servername || !this.port) return
      const url = `${this.protocol}://${this.servername}:${this.port}/v1/info`
      try {
        this.adding = true
        const { data } = await axios.get(url)
        console.log('data:', data)
        const server = {
          proto: this.protocol,
          name: this.servername,
          hport: this.port,
          iport: data.iport,
          bport: data.bport
        }
        const server2 = await this.addServer(server)
        console.log('server:', server2)
        this.$router.replace({ name: 'ListAccounts', params: { server: server2.url } })
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
