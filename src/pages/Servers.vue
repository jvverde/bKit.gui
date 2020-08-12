<template>
  <q-page padding class="fit column no-wrap items-center relative-position">
    <div class="q-pa-sm q-mt-sm  q-gutter-x-sm row items-center full-width self-start">
      <div>Manage server:</div>
      <div @click="change(server)"
        v-for="(server, index) in serverAddresses" :key="index">
        <q-btn flat :color="color(server)" icon="storage" :icon-right="isSelected(server) ? 'done' : ''">
          <span style="color:black">{{server}}</span>
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
// import { getAccounts } from 'src/helpers/credentials'
import { catched } from 'src/helpers/notify'
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'Servers',
  data () {
    return {
      selectedServer: undefined,
      loading: false,
      adding: false,
      error: false
    }
  },
  props: ['back'],
  computed: {
    ...mapGetters('global', ['serverAddresses'])
  },
  watch: {
    selectedServer: {
      immediate: true,
      handler (val, old) {
        if (val && val !== old) this.$router.replace({ name: 'ListAccounts', params: { server: val } })
      }
    }
  },
  methods: {
    ...mapActions('global', ['loadCredentials', 'loadServers', 'getCurrentServer']),
    isSelected (servername) {
      return servername === this.selectedServer
    },
    color (servername) {
      return this.isSelected(servername) ? 'green' : 'black'
    },
    go () {
      this.$router.push('/backup')
    },
    change (servername) {
      this.selectedServer = servername
    },
    add () {
      this.$router.push({ name: 'NewServer' })
    },
    async load () {
      this.loading = true
      try {
        this.loadCredentials()
        this.loadServers()
        const cserver = await this.getCurrentServer()
        this.change(cserver.address)
      } catch (e) {
        catched(e)
      } finally {
        this.loading = false
      }
    }
  },
  mounted () {
    this.load()
  }
}
</script>
