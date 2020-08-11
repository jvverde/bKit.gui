<template>
  <q-page padding class="fit column no-wrap items-center relative-position">
    <div class="q-pa-sm q-mt-sm  q-gutter-x-sm row items-center full-width self-start">
      <div>Current server:</div>
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
import { changeServer } from 'src/helpers/bkit'
// import { getAccounts } from 'src/helpers/credentials'
import { catched } from 'src/helpers/notify'
import { mapMutations, mapGetters, mapActions } from 'vuex'

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
    ...mapGetters('global', ['selectedServer', 'serverAddresses', 'getServer'])
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
    ...mapMutations('global', ['selectServer', 'setbkitServer', 'addServers']),
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
    setbkitserver (servername) {
      // console.log('Set default bkit server', server.address)
      // this.loading = true
      changeServer(servername)
      //   .then(() => this.setbkitServer(server))
      //   .catch((err) => console.warn('Change server error', err))
      //   .finally(() => { this.loading = false })
    },
    change (servername) {
      this.selectServer(servername)
    },
    add () {
      this.$router.push({ name: 'NewServer' })
    },
    async load () {
      this.loading = true
      try {
        const p1 = this.loadCredentials()
        const p2 = this.loadServers()
        await Promise.all([p1, p2])
        const c = await this.getCurrentServer()
        console.log('current', c)
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
