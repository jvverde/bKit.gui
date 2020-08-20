<template>
  <q-page padding class="fit column no-wrap items-center relative-position">
    <div class="q-pa-sm q-mt-sm  q-gutter-x-sm row items-center full-width self-start">
      <div>Manage server:</div>
      <div @click="change(srvname)"
        v-for="(srvname, index) in srvnames" :key="index">
        <q-btn flat :color="color(srvname)" icon="storage" :icon-right="isSelected(srvname) ? 'done' : ''">
          <span style="color:black">{{srvname}}</span>
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
    srvnames () { return [...this.serverAddresses].sort() }
  },
  watch: {
    selectedServer: {
      immediate: true,
      handler (srvname, oldname) {
        if (srvname && srvname !== oldname) {
          console.log('Change to ListAccounts of ', srvname)
          this.$router.push({ name: 'ListAccounts', params: { server: srvname } }).catch(() => {})
        }
      }
    },
    '$route' (to, from) {
      if (to.name === 'ListAccounts' && to.params && to.params.server) {
        console.log('Route to server', to.params.server)
        this.selectedServer = to.params.server
      }
    },
    srvnames (addresses) {
      if (this.selectedServer && addresses.includes(this.selectedServer)) return
      this.change2current()
    }
  },
  methods: {
    ...mapActions('global', ['loadCredentials', 'loadAccounts', 'getCurrentAccount']),
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
    change2current () {
      return this.getCurrentAccount()
        .then(cserver => this.change(cserver.address))
    },
    async load () {
      try {
        this.msg = 'Loading profiles'
        await this.loadAccounts()
        this.msg = 'Loading credentials'
        await this.loadCredentials()
        this.msg = 'Get Current Server'
        this.change2current()
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
