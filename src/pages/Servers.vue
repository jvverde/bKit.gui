<template>
  <q-page padding class="relative">
    <q-list padding class="absolute-center">
      <q-item>
        <q-item-section>
          <q-item-label>Change to bKit server:</q-item-label>
        </q-item-section>
      </q-item>
      <q-separator spaced />
      <q-item clickable v-ripple v-for="(server, index) in servers" :key="index">
        <q-item-section avatar>
          <q-icon :color="color(server)" name="storage" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{server}}</q-item-label>
        </q-item-section>
      </q-item>

    </q-list>
  </q-page>
</template>

<script>
import { listServers, getServer } from 'src/helpers/bkit'

export default {
  name: 'Servers',
  data () {
    return {
      current: undefined,
      servers: []
    }
  },
  methods: {
    color (server) {
      console.log('current', this.current)
      return server === this.current ? 'green' : 'cyan'
    },
    reload () {
      listServers()
        .then(servers => {
          console.log('servers', servers)
          this.servers = servers
        })
      getServer()
        .then(server => (this.current = server))
    }
  },
  mounted () {
    this.reload()
  }
}
</script>
