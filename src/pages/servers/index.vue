<template>
  <q-page padding class="fit column no-wrap items-center relative-position">
    <div v-if="hasServers"
      class="q-pa-sm q-mt-sm  q-gutter-x-sm row items-center full-width self-start">
      <div>Manage server:</div>
      <div @click="changeTo(serverURL)"
        v-for="(serverURL, index) in serversList" :key="index">
        <q-btn flat :color="color(serverURL)" icon="storage" :icon-right="icon(serverURL)" no-caps>
          <span style="color:black">{{serverURL}}</span>
        </q-btn>
      </div>
      <div style="margin-left:auto" class="q-my-sm">
        <q-btn round icon="add" dense size="sm" @click="add"/>
      </div>
    </div>
    <div v-else-if="noServers" class="fit column items-center justify-center">
      <q-btn rounded icon="add" label="Add a server" no-caps size="xl" @click="add"/>
    </div>
    <div class="fit relative-position routerview">
      <router-view></router-view>
    </div>
  </q-page>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
let lastServer

export default {
  name: 'Servers',
  data () {
    return {
    }
  },
  computed: {
    ...mapGetters('accounts', ['getAccounts', 'accountServerURL']),
    servers () {
      return [...new Set(this.getAccounts.map(a => a.serverURL))]
    },
    hasServers () { return this.servers.length > 0 },
    noServers () { return !this.hasServers && this.$route.name === 'servers' },
    serversList () { return [...this.servers].sort() },
    selectedServer: {
      get () {
        return this.server
      },
      set (url) {
        this.$router.push({ name: 'ListAccounts', params: { server: url } }).catch(() => {})
      }
    }
  },
  props: ['server'], // Is only defined for sub-paths
  watch: {
    selectedServer (serverURL) {
      lastServer = serverURL
    },
    servers (names) {
      if (this.selectedServer && names.includes(this.selectedServer)) return // Do nothing if selected server is already included in the servers list
      this.guess2change() // Otherwise changeTo to current server
    }
  },
  methods: {
    ...mapActions('accounts', ['getCurrentAccount']),
    isSelected (serverURL) {
      return serverURL === this.selectedServer
    },
    isCurrent (serverURL) {
      return serverURL === this.accountServerURL
    },
    color (serverURL) {
      return this.isSelected(serverURL) ? 'active' : ''
    },
    icon (serverURL) {
      return this.isCurrent(serverURL) ? 'done' : ''
    },
    changeTo (serverURL) {
      if (this.servers.includes(serverURL)) {
        this.selectedServer = serverURL
      } else {
        this.selectedServer = this.server[0]
      }
    },
    async guess2change () {
      const current = await this.getCurrentAccount()
      if (current) {
        this.changeTo(current.serverURL)
      } else { // Else go to selected server whichever it is
        this.changeTo(this.selectedServer)
      }
    },
    add () {
      this.$router.push({ name: 'NewServer' })
    }
  },
  mounted () {
    console.log('Last server was', lastServer)
    if (this.selectedServer) return // do nothing if a server is already selected on route path
    if (lastServer) { // Use last server to avoid annoying the user experience
      this.changeTo(lastServer)
    } else {
      this.guess2change()
    }
  }
}
</script>
