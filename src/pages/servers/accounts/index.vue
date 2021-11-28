<template>
  <div class="fit relative-position column no-wrap">
    <div class="q-pa-sm q-gutter-x-sm row items-center full-width self-start">
      <div v-if="some">
        Registered account<span v-if="several">s</span> for server {{server}}:
      </div>
      <div v-for="(account, index) in accounts" :key="index">
        <q-chip clickable
          @click="changeTo(account)"
          :color="color(account)"
          :outline="isSelected(account)"
          :icon-right="icon(account)"
          icon="person">
          {{account.user}}
        </q-chip>
      </div>
      <div v-if="zero && isListAccount" class="absolute-center column items-center q-gutter-x-sm z-top">
        <div class="text-h6">No accounts</div>
        <div>You don't have any account configured for server {{server}}</div>
        <div>Please add a new one</div>
        <q-btn class="q-mt-xl" icon="add" label="New Account" rounded no-caps dense @click="add"/>
      </div>
      <div v-else-if="some" class="q-my-sm">
        <q-btn icon="add" round no-caps dense size="sm" @click="add"/>
      </div>
    </div>
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
const lastSelected = {}

export default {
  name: 'ListAccounts',
  data () {
    return {
    }
  },
  computed: {
    ...mapGetters('accounts', ['getAccountsByServerURL', 'accountName']),
    selected: {
      get () {
        return this.accounts.find(a => a.serverURL === this.server && a.user === this.user)
      },
      set (account) {
        if (account) this.$router.push({ name: 'Account', params: { server: account.serverURL, user: account.user } }).catch(() => {})
      }
    },
    accounts () {
      return [...this.getAccountsByServerURL(this.server)].sort(compbyuser)
    },
    accountNames () {
      return this.accounts.map(a => a.name)
    },
    naccounts () {
      return this.accounts.length
    },
    zero () { return this.naccounts === 0 },
    several () { return this.naccounts > 1 },
    some () { return !this.zero },
    isListAccount () { return this.$route.name === 'ListAccounts' }
  },
  props: ['server', 'user'], // User is only defined/used for/in sub-paths
  watch: {
    selected (account) {
      if (account) lastSelected[this.server] = account
    },
    accounts (accounts) {
      if (this.selected && this.accountNames.includes(this.selected.name)) return // Do nothing if selected account is already included in the accounts list
      this.guess2change() // Otherwise changeTo to current account
    }
  },
  methods: {
    ...mapActions('accounts', ['getCurrentAccount']),
    add () {
      this.$router.push({ name: 'NewAccount', params: { server: this.server } })
    },
    isCurrent (account) {
      return account && account.name === this.accountName
    },
    isSelected (account) {
      return account && this.selected && account.name === this.selected.name
    },
    color (account) {
      return this.isSelected(account) ? 'active' : ''
    },
    icon (account) {
      // return 'done'
      return this.isCurrent(account) ? 'done' : ''
    },
    changeTo (account = {}) {
      if (this.accountNames.includes(account.name)) {
        this.selected = account
      } else {
        this.selected = this.accounts[0]
      }
    },
    async guess2change () {
      const last = lastSelected[this.server]
      if (last && this.accountNames.includes(last.name)) {
        this.selected = last
      } else {
        const current = await this.getCurrentAccount()
        this.changeTo(current)
      }
    }
  },
  async mounted () {
    const { user } = this.$route.params
    if (!user) this.guess2change()
    console.log('router', this.$route)
  },
  beforeUpdate () {
  },
  updated () {
  }
}
</script>
