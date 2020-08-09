<template>
  <q-page padding class="fit column no-wrap items-center relative-position">
    <div class="q-pa-sm q-mt-sm  q-gutter-x-sm row items-center full-width self-start">
      <div>Current server:</div>
      <div @click="change(server)"
        v-for="(server, index) in servers" :key="index">
        <q-btn flat :color="color(server)" icon="storage" :icon-right="isSelected(server) ? 'done' : ''">
          <span style="color:black">{{server.address}}{{server.pairing}}</span>
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
import { getAccounts } from 'src/helpers/credentials'
import { catched } from 'src/helpers/notify'
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
        if (val && val !== old) this.$router.replace({ name: 'ListAccounts', params: { server: val } })
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
    async loadCredentials () {
      try {
        const accounts = await getAccounts()
        const servers = accounts.map(u => {
          const [account, address] = u.split('@')
          return { address, account, credentials: true }
        })
        console.log('servers', servers)
        this.addServers(servers)
      } catch (err) {
        this.catch(err)
      }
    },
    async loadServer () {
      this.loading = true
      try {
        const serversList = await listServers('-f')
        const servers = serversList.map(s => {
          const [account, url] = s.split('@')
          const [address, , section, iport, bport, rport, uport, aport] = url.split(':')
          return { address, account, section, iport, bport, rport, uport, aport, pairing: true }
        })
        this.addServers(servers)
        const server = await getServer()
        this.selectServer(server)
      } catch (e) {
        catched(e)
      } finally {
        this.loading = false
      }
    }
  },
  mounted () {
    console.log('back:', this.back)
    this.loadCredentials()
    this.loadServer()
  }
}
</script>
