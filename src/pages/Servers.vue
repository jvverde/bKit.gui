<template>
  <q-page padding class="fit column no-wrap items-center">
    <div class="q-pa-xl row items-center full-width self-start">
      <div>Current server:</div>
      <div @click="change(server)"
        v-for="(server, index) in servers" :key="index">
        <q-btn flat :color="color(server)" icon="storage" :icon-right="isSelected(server) ? 'done' : ''">
          <span style="color:black">{{server}}</span>
        </q-btn>
      </div>
      <q-inner-loading :showing="loading">
        <q-spinner-ios color="loader"/>
      </q-inner-loading>
      <div style="margin-left:auto" class="q-my-sm">
         <q-btn icon="add" label="New Server" no-caps  @click="add"/>
      </div>
    </div>
    <div>
      <router-view></router-view>
    </div>
  </q-page>
</template>

<script>
import { listServers, getServer, changeServer } from 'src/helpers/bkit'
// import { warn } from 'src/helpers/notify'

export default {
  name: 'Servers',
  data () {
    return {
      current: undefined,
      loading: false,
      adding: false,
      error: false,
      servers: []
    }
  },
  props: ['back'],
  watch: {
  },
  methods: {
    isSelected (server) {
      return server === this.current
    },
    color (server) {
      return this.isSelected(server) ? 'green' : 'black'
    },
    go () {
      this.$router.push('/backup')
    },
    change (server) {
      console.log('Change to', server)
      this.loading = true
      changeServer(server)
        .then(() => this.setServer(server))
        .catch((err) => console.warn('Change server error', err))
        .finally(() => { this.loading = false })
      this.$router.push(`/servers/${server}/users`)
    },
    setServer (server) {
      this.$store.commit('global/setServer', server)
      // this.$router.push(`/servers/server/${server}`)
      this.current = server
    },
    add () {
      this.$router.push('/servers/new/server')
    },
    reload () {
      this.loading = true
      const p1 = listServers()
        .then(servers => {
          this.servers = servers
        })

      const p2 = getServer()
        .then(server => {
          this.current = server
          this.setServer(server)
          console.log('Go back to', this.back)
          if (this.back) this.$router.push({ name: this.back })
        })

      return Promise.all([p1, p2])
        .finally(() => (this.loading = false))
    }
  },
  mounted () {
    console.log('back', this.back)
    this.reload()
  }
}
</script>
