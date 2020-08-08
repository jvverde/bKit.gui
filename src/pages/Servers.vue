<template>
  <q-page padding class="fit column no-wrap items-center relative-position">
    <div class="q-pa-sm q-mt-sm  q-gutter-x-sm row items-center full-width self-start">
      <div>Current server:</div>
      <div @click="change(server)"
        v-for="(server, index) in servers" :key="index">
        <q-btn flat :color="color(server)" icon="storage" :icon-right="isSelected(server) ? 'done' : ''">
          <span style="color:black">{{server.address}}</span>
        </q-btn>
      </div>
      <q-inner-loading :showing="loading">
        <q-spinner-ios size="xl" color="loader"/>
      </q-inner-loading>
      <div style="margin-left:auto" class="q-my-sm">
         <q-btn icon="add" label="New Server" no-caps  dense @click="add"/>
      </div>
    </div>
    <div class="fit relative-position routerview">
      <router-view></router-view>
    </div>
  </q-page>
</template>

<script>
import { listServers, getServer, changeServer } from 'src/helpers/bkit'
// import { warn } from 'src/helpers/notify'
import { mapMutations, mapGetters } from 'vuex'

export default {
  name: 'Servers',
  data () {
    return {
      loading: false,
      adding: false,
      error: false
    }
  },
  props: ['back'],
  computed: {
    ...mapGetters('global', ['serverAddress', 'servers'])
  },
  watch: {
    serverAddress: {
      immediate: true,
      handler (val, old) {
        if (val && val !== old) this.$router.push({ name: 'ListAccounts', params: { server: val } })
      }
    }
  },
  methods: {
    ...mapMutations('global', ['selectServer', 'setbkitServer', 'addServers']),
    isSelected (server) {
      return server.address === this.serverAddress
    },
    color (server) {
      return this.isSelected(server) ? 'green' : 'black'
    },
    go () {
      this.$router.push('/backup')
    },
    setbkitserver (server) {
      console.log('Set default bkit server', server.address)
      this.loading = true
      changeServer(server.address)
        .then(() => this.setbkitServer(server))
        .catch((err) => console.warn('Change server error', err))
        .finally(() => { this.loading = false })
    },
    change (server) {
      this.selectServer(server)
    },
    add () {
      this.$router.push({ name: 'NewServer' })
    },
    reload () {
      this.loading = true
      const p1 = listServers()
        .then(servers => this.addServers(servers))

      const p2 = getServer()
        .then(server => this.selectServer(server))

      return Promise.all([p1, p2])
        .finally(() => (this.loading = false))
    }
  },
  mounted () {
    console.log('back:', this.back)
    this.reload()
  }
}
</script>
