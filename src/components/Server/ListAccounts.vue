<template>
  <div class="fit relative-position column no-wrap">
    <div class="q-pa-sm q-gutter-x-sm row items-center full-width self-start">
      <div v-show="some">
        Registered account<span v-if="one">s</span> for server {{server}}:
      </div>
      <div v-for="(account, index) in accounts" :key="index">
        <q-chip clickable
          @click="selected = account"
          :color="color(account)"
          :outline="isCurrent(account)"
          icon="person">
          {{account.user}}
        </q-chip>
      </div>
      <div v-if="some" style="margin-left:auto" class="q-my-sm">
        <q-btn class="q-px-sm" icon="add" label="New Account" outline rounded no-caps dense @click="add"/>
      </div>
      <div v-else class="absolute-center column items-center q-gutter-x-sm z-top">
        <div class="text-h6">No accounts</div>
        <div>You don't have any account configured for server {{server}}</div>
        <div>Please add a new one</div>
        <q-btn class="q-mt-xl" icon="add" outline rounded label="New Account" no-caps @click="add"/>
      </div>
    </div>
    <q-inner-loading :showing="loading">
      <q-spinner-ios size="xl" color="loader"/>
    </q-inner-loading>
    <div class="fit relative-position routerview">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>

const compbyuser = (a, b) => {
  if (a.user < b.user) return -1
  if (a.user > b.user) return 1
  return 0
}

import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'ListAccounts',
  data () {
    return {
      currentOf: {},
      loading: false
    }
  },
  computed: {
    ...mapGetters('global', ['getAccountsByServer']),
    selected: {
      get () {
        return this.currentOf[this.server]
      },
      set (val) {
        this.$set(this.currentOf, this.server, val)
      }
    },
    accounts () {
      return [...this.getAccountsByServer(this.server).filter(a => a.user)].sort(compbyuser)
    },
    sortAccounts () { return [...this.accounts].sort() },
    zero () { return this.accounts.length === 0 },
    one () { return this.accounts.length === 1 },
    some () { return !this.zero }
  },
  props: ['server'],
  watch: {
    accounts (accounts) {
      console.log('Accounts change')
      if (this.selected && this.selected.address !== this.server) {
        this.SelectOne()
      } else if (this.selected && accounts.find(account => account.user === this.selected.user)) {
        /* In case the selected is pointing to one existing account, do nothing */
      } else {
        console.log('Go back on Accounts change', this.selected)
        this.$router.back()
      }
    },
    server: {
      immediate: true,
      handler (servername) {
        console.log('server change', servername, (this.selected || {}).address)
        if (!this.selected || this.selected.address !== servername) this.selectOne()
      }
    },
    selected: {
      immediate: true,
      handler (account) {
        console.log('Selected change', (account || {}).user)
        if (!account || !account.user) return
        this.manage(account)
      }
    },
    $route (to, from) {
      if (this.some && to.name === 'Account' && to.params && to.params.user) {
        console.log('User', to.params.user)
        const selected = this.accounts.find(a => a.user === to.params.user)
        if (selected) {
          console.log('Yes, set select to', selected.address, selected.user)
          this.selected = selected
        } else {
          console.log('NO, go back', this.server)
          this.$router.back()
        }
      } else if (to.name === 'ListAccounts') {
        console.log('Unset selected')
        this.selected = undefined
      }
    }
  },
  methods: {
    ...mapActions('global', ['delCredentials', 'getCurrentServer']),
    add () {
      this.$router.push({ name: 'NewAccount', params: { server: this.server } })
    },
    isCurrent (account) {
      return account && this.selected && account.address === this.selected.address && account.user === this.selected.user
    },
    color (account) {
      return this.isCurrent(account) ? 'active' : ''
    },
    manage (account) {
      // Edit account
      const location = {
        name: 'Account',
        params: {
          server: this.server,
          user: account.user
        }
      }
      const { route } = this.$router.resolve(location)
      console.log('compare', route.path, this.$route.path)
      if (route.path === this.$route.path) return
      // There are a alternative way to the above check https://stackoverflow.com/a/61111771
      console.log('Allow to Go', route.path)
      this.$router.push(location)
    },
    async selectOne () {
      console.log('SelectOne')
      const cserver = await this.getCurrentServer()
      if (cserver.address === this.server) {
        console.log('Go to current Server')
        this.selected = cserver
      } else {
        console.log('Go to first account')
        this.selected = this.accounts[0]
      }
    }
  },
  async mounted () {
  },
  beforeUpdate () {
  },
  updated () {
  }
}
</script>
