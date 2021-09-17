<template>
  <q-page padding class="fit column no-wrap items-center relative-position">
    <div v-if="hasServers"
      class="q-pa-sm q-mt-sm  q-gutter-x-sm row items-center full-width self-start">
      <div>Manage server:</div>
      <div @click="change(servername)"
        v-for="(servername, index) in servernames" :key="index">
        <q-btn flat :color="color(servername)" icon="storage" :icon-right="icon(servername)" no-caps>
          <span style="color:black">{{servername}}</span>
        </q-btn>
      </div>
      <div style="margin-left:auto" class="q-my-sm">
        <q-btn round icon="add" dense size="sm" @click="add"/>
      </div>
    </div>
    <div v-else-if="noServers" class="fit column items-center justify-center">
      <q-btn v-show="!loading" rounded icon="add" label="Add a server" no-caps size="xl" @click="add"/>
    </div>
    <div class="fit relative-position routerview">
      <router-view></router-view>
    </div>
    <q-inner-loading :showing="loading">
      <q-spinner-ios size="xl" color="loader"/>
      <span v-if="msg">{{msg}}</span>
    </q-inner-loading>
  </q-page>
</template>

<script>
// import { getAccounts } from 'src/helpers/credentials'
import { catched } from 'src/helpers/notify'
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'Servers',
  data () {
    return {
      selectedServer: undefined,
      msg: undefined,
      adding: false,
      error: false
    }
  },
  computed: {
    ...mapGetters('accounts', ['servers']),
    loading () { return this.msg && this.msg.length > 0 },
    hasServers () { return this.servers.length > 0 },
    noServers () { return !this.hasServers && this.$route.name === 'servers' },
    servernames () { return [...this.servers].sort() }
  },
  watch: {
    selectedServer: {
      immediate: true,
      handler (servername, oldname) {
        console.log('selectedServer', servername, oldname)
        if (servername && servername !== oldname) {
          console.log('Change to ListAccounts of ', servername)
          this.listAccounts(servername)
        } else if (servername === false && oldname) {
          console.log('Change to Servers ', servername)
          this.$router.push({ name: 'servers' }).catch(() => {})
        }
      }
    },
    '$route' (to, from) {
      console.log('$route', to)
      if (to.name === 'ListAccounts' && to.params && to.params.server) {
        console.log('Route to server', to.params.server)
        this.selectedServer = to.params.server
      }
    },
    servernames (names) {
      if (this.selectedServer && names.includes(this.selectedServer)) return
      this.change2current()
    }
  },
  methods: {
    ...mapActions('accounts', ['loadCredentials', 'loadAccounts', 'getCurrentAccount']),
    isSelected (servername) {
      return servername === this.selectedServer
    },
    mystyle (servername) {
      return this.isSelected(servername) ? { color: 'active', icon: 'done' } : {}
    },
    color (servername) {
      return this.mystyle(servername).color
    },
    icon (servername) {
      return this.mystyle(servername).icon
    },
    listAccounts (servername = this.selectedServer) {
      if (servername) {
        this.$router.push({ name: 'ListAccounts', params: { server: servername } }).catch(() => {})
      }
    },
    change (servername) {
      if (this.isSelected(servername)) {
        this.selectedServer = false
      } else {
        this.selectedServer = servername
      }
    },
    add () {
      this.$router.push({ name: 'NewServer' })
    },
    change2current () {
      return this.getCurrentAccount()
        .then((server = {}) => this.change(server.servername))
    },
    async load () {
      try {
        // this.msg = 'Loading profiles'
        // await this.loadAccounts()
        // this.msg = 'Loading credentials'
        // await this.loadCredentials()
        // this.msg = 'Get Current Server'
        this.change2current()
      } catch (e) {
        catched(e)
      } finally {
        this.msg = undefined
      }
    }
  },
  mounted () {
    console.log('Mount server')
    this.load()
  }
}
</script>
