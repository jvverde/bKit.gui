<template>
  <q-page padding class="fit column no-wrap items-center relative-position">
    <div class="q-pa-sm q-mt-sm  q-gutter-x-sm row items-center full-width self-start">
      <div>Manage server:</div>
      <div @click="change(server)"
        v-for="(server, index) in sortAddress" :key="index">
        <q-btn flat :color="color(server)" icon="storage" :icon-right="isSelected(server) ? 'done' : ''">
          <span style="color:black">{{server}}</span>
        </q-btn>
      </div>
      <div style="margin-left:auto" class="q-my-sm">
         <q-btn class="q-px-sm" rounded outline icon="add" label="New Server" no-caps dense @click="add"/>
      </div>
    </div>
    <div class="fit relative-position routerview">
      <router-view></router-view>
    </div>
    <q-inner-loading :showing="loading">
      <q-spinner-ios size="xl" color="loader"/>
      <span>{{msg}}</span>
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
  props: ['back'],
  computed: {
    ...mapGetters('global', ['serverAddresses']),
    loading () { return this.msg && this.msg.length > 0 },
    sortAddress () { return [...this.serverAddresses].sort() }
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
      return this.isSelected(servername) ? 'active' : ''
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
      try {
        this.msg = 'Loading profiles'
        await this.loadServers()
        this.msg = 'Loading credentials'
        await this.loadCredentials()
        this.msg = 'Get Current Server'
        const cserver = await this.getCurrentServer()
        this.change(cserver.address)
      } catch (e) {
        catched(e)
      } finally {
        this.msg = undefined
      }
    }
  },
  mounted () {
    this.load()
  }
}
</script>
