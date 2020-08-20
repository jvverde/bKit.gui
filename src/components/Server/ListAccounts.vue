<template>
  <div class="fit relative-position column no-wrap">
    <div class="q-pa-sm q-gutter-x-sm row items-center full-width self-start">
      <div v-if="some">
        Registered account<span v-if="one">s</span> for server {{server}}:
      </div>
      <div v-for="(account, index) in accounts" :key="index">
        <q-chip clickable
          @click="load(account)"
          :color="color(account)"
          :outline="isCurrent(account)"
          icon="person">
          {{account.user}}
        </q-chip>
      </div>
      <div v-if="noChildren && zero" class="absolute-center column items-center q-gutter-x-sm z-top">
        <div class="text-h6">No accounts</div>
        <div>You don't have any account configured for server {{server}}</div>
        <div>Please add a new one</div>
        <q-btn class="q-mt-xl" icon="add" outline rounded label="New Account" no-caps @click="add"/>
      </div>
      <div v-else-if="some" style="margin-left:auto" class="q-my-sm">
        <q-btn class="q-px-sm" icon="add" label="New Account" outline rounded no-caps dense @click="add"/>
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

const findNewElePosition = (a, b) => {
  // find the position of the first of new elements
  // assuming a.length > b.length
  for (let i = 0; i < b.length; i++) {
    const ae = a[i]
    if (!b.find(be => be.user === ae.user && be.address === ae.address)) return i
  }
  return b.length
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
    length () { return this.accounts.length },
    zero () { return this.length === 0 },
    one () { return this.length === 1 },
    some () { return !this.zero },
    currentAccount () {
      return this.$route.name === 'Account' ? {
        user: this.$route.params.user,
        servername: this.$route.params.server
      } : {}
    },
    noChildren () { return this.$route.name === 'ListAccounts' }
  },
  props: ['server'],
  watch: {
    server: {
      immediate: true,
      handler (servername, old) {
        this.selectOne()
      }
    },
    $route: {
      immediate: true,
      handler (to, from) {
        console.log('Watch $route', to.name)
        if (to && to.params && to.name === 'Account') {
          this.selected = this.accounts.find(a => a.address === to.params.server && a.user === to.params.user)
        }
      }
    },
    accounts: {
      immediate: false,
      deep: true,
      handler (accounts, old) {
        // Here we are only interested on changes in the number of accounts (new or removed) under same server
        console.log('Watch Accounts')
        if (accounts && old && accounts.length !== old.length) {
          const selected = this.selected || {}
          setTimeout(() => { // wait a while and let any pending transition to occur first
            console.log('Process Watch')
            if (accounts.length === 0) {
              console.log('There is no more accounts')
              this.$router.push({ name: 'ListAccounts', params: { server: this.server } }).catch(() => {})
            } else if (accounts.length > old.length) {
              console.log('Detected a new account')
              const index = findNewElePosition(accounts, old)
              console.log('The new element is at position', index)
              this.load(accounts[index])
            } else if (accounts.length < old.length) {
              console.log('Detected a possible removed account')
              const index = old.findIndex(a => a.user === selected.user && a.address === selected.address)
              if (index === -1) {
                console.log('Not found the removed account. Do nothing')
              } else if (index >= accounts.length) {
                console.log('Set to last account')
                this.load(accounts[accounts.length - 1])
              } else {
                console.log('Set to account at same position')
                this.load(accounts[index])
              }
            }
          }, 100)
        } // fi
      }
    }
  },
  methods: {
    ...mapActions('global', ['delCredentials', 'getCurrentServer']),
    add () {
      this.$router.push({ name: 'NewAccount', params: { server: this.server } })
    },
    isCurrent (account) {
      return account && this.currentAccount && account.address === this.currentAccount.servername && account.user === this.currentAccount.user
    },
    color (account) {
      return this.isCurrent(account) ? 'active' : ''
    },
    load (account) {
      if (!account || !account.address || !account.user) return
      this.$router.push({ name: 'Account', params: { server: account.address, user: account.user } }).catch(() => {})
    },
    async selectOne () {
      console.log('SelectOne')
      if (this.selected && this.accounts.find(a => a.user === this.selected.user && a.address === this.selected.address)) {
        console.log('Show previous one')
        this.load(this.selected)
      } else {
        const cserver = await this.getCurrentServer()
        if (cserver.address === this.server) {
          console.log('Go to current Server')
          this.load(cserver)
        } else {
          console.log('Go to first account')
          this.load(this.accounts[0])
        }
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
