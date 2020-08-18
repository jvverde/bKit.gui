<template>
  <div class="fit relative-position column no-wrap">
    <div class="q-pa-sm q-gutter-x-sm row items-center full-width self-start">
      <div v-show="some">
        Registered account<span v-if="one">s</span> for server {{server}}:
      </div>
      <div v-for="(account, index) in accounts" :key="index">
        <q-chip clickable
          @click="manage(account)"
          :color="color(account)"
          :outline="isCurrent(account)"
          icon="person">
          {{account.user}}
        </q-chip>
      </div>
      <div v-if="some" style="margin-left:auto" class="q-my-sm">
        <q-btn class="q-px-sm" icon="add" label="New Account" outline rounded no-caps dense @click="add"/>
      </div>
      <div v-else class="absolute-center column items-center q-gutter-x-sm">
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
    accounts () { return this.getAccountsByServer(this.server).filter(a => a.user) },
    sortAccounts () { return [...this.accounts].sort() },
    zero () { return this.accounts.length === 0 },
    one () { return this.accounts.length === 1 },
    some () { return !this.zero }
  },
  props: ['server'],
  watch: {
    accounts (accounts) {
      console.log('accounts change')
      if (this.selected && accounts.find(account => account.user === this.selected.user)) return
      this.selected = accounts[0]
    },
    server: {
      immediate: true,
      handler (val, oldval) {
        this.selected = this.selected || this.accounts[0]
      }
    },
    selected: {
      immediate: true,
      handler (account, oldval) {
        if (!account || !account.user) return
        this.$router.push({
          name: 'Account',
          params: {
            server: this.server,
            user: account.user
          }
        })
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
      this.selected = account
    }
  },
  async mounted () {
    const cserver = await this.getCurrentServer()
    console.log('selected account', cserver.address, cserver.user)
    if (cserver.address === this.server) this.selected = selected
  },
  beforeUpdate () {
  },
  updated () {
  }
}
</script>
