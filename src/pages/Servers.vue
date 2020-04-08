<template>
  <q-page padding class="relative">
    <q-list padding class="absolute-center" style="min-width:25em">
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
          <q-input rounded outlined dense
            type="url"
            v-model="newserver"
            placeholder="IP Address or Server Name"
            hint="Address of a bKit server"
            label="Add Server">
            <template v-slot:after>
              <q-btn flat icon="add" no-caps stack label="Connect"/>
            </template>
          </q-input>
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script>
import { listServers, getServer, changeServer } from 'src/helpers/bkit'

export default {
  name: 'Servers',
  data () {
    return {
      current: undefined,
      newserver: undefined,
      servers: []
    }
  },
  methods: {
    color (server) {
      return server === this.current ? 'green' : 'cyan'
    },
    change (server) {
      changeServer(server).then(() => this.reload())
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
