<template>
  <q-page padding class="relative">
    <q-list padding class="absolute-center" style="min-width:20em">
      <q-item>
        <q-item-section>
          <q-item-label>Change to bKit server:</q-item-label>
        </q-item-section>
      </q-item>
      <q-separator spaced />
      <q-item clickable v-ripple
        @click="change(server)"
        v-for="(server, index) in servers" :key="index">
        <q-item-section avatar>
          <q-icon :color="color(server)" name="storage" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{server}}</q-item-label>
        </q-item-section>
      </q-item>

      <q-item>
        <q-item-section>
          <q-input rounded outlined dense clearable
            @keyup.enter="add"
            @keydown.tab="add"
            type="url"
            v-model="newserver"
            :loading="loading"
            :error="!!error"
            :error-message="`Server '${newserver}' not found`"
            @clear="error=false"
            placeholder="IP Address or Server Name"
            hint="Address of a bKit server"
            label="Add Server">
            <template v-slot:append>
              <q-btn outline icon="add" no-caps stack
                @click="add"
                size="xs"
                round
                color="green"/>
            </template>
          </q-input>
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script>
import { listServers, getServer, changeServer } from 'src/helpers/bkit'
import { warn } from 'src/helpers/notify'

export default {
  name: 'Servers',
  data () {
    return {
      current: undefined,
      newserver: undefined,
      loading: false,
      error: false,
      servers: []
    }
  },
  watch: {
    current (val) {
      console.log('Current', val)
    }
  },
  methods: {
    color (server) {
      return server === this.current ? 'green' : 'cyan'
    },
    change (server) {
      changeServer(server).then(() => this.reload())
    },
    add () {
      if (!this.newserver) return
      this.error = null
      this.loading = true
      changeServer(this.newserver)
        .then(() => this.reload())
        .catch(err => {
          this.error = err
          warn(err)
        })
        .finally(() => {
          this.loading = false
        })
    },
    reload () {
      listServers()
        .then(servers => {
          this.servers = servers
        })

      getServer()
        .then(server => {
          this.current = server
          this.$store.commit('global/setServer', server)
        })
    }
  },
  mounted () {
    this.reload()
  }
}
</script>
