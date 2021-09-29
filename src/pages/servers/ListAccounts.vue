<template>
  <div class="fit relative-position column no-wrap">
    <div class="q-pa-sm q-gutter-x-sm row items-center full-width self-start">
      <div v-if="some">
        Registered account<span v-if="!one">s</span> for server {{server}}:
      </div>
      <div v-for="(account, index) in accounts" :key="index">
        <q-chip clickable
          @click="changeTo(account)"
          :color="color(account)"
          :outline="isSelected(account)"
          icon="person">
          {{account.user}}
        </q-chip>
      </div>
      <div v-if="noAccounts && zero" class="absolute-center column items-center q-gutter-x-sm z-top">
        <div class="text-h6">No accounts</div>
        <div>You don't have any account configured for server {{server}}</div>
        <div>Please add a new one</div>
        <q-btn class="q-mt-xl" icon="add" label="New Account" rounded no-caps dense @click="add"/>
      </div>
      <div v-else-if="some" style="margin-left:auto" class="q-my-sm">
        <q-btn class="q-px-sm" icon="add" label="New Account" rounded no-caps dense size="sm" @click="add"/>
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

// const findNewElePosition = (a, b) => {
//   // find the position of the first of new elements
//   // assuming a.length > b.length
//   for (let i = 0; i < b.length; i++) {
//     const ae = a[i]
//     if (!b.find(be => be.user === ae.user && be.serverURL === ae.serverURL)) return i
//   }
//   return b.length
// }

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
    ...mapGetters('accounts', ['getAccountsByServerURL', 'currentAccount']),
    selected: {
      get () {
        // return this.currentOf[this.server]
        const { server, user } = this.$route.params
        return this.accounts.find(a => a.serverURL === server && a.user === user)
      },
      set (account) {
        this.$router.push({ name: 'Account', params: { server: account.serverURL, user: account.user } }).catch(() => {})
        // this.$set(this.currentOf, this.server, val)
      }
    },
    accounts () {
      return [...this.getAccountsByServerURL(this.server)].sort(compbyuser)
    },
    accountNames () {
      return this.accounts.map(a => a.name)
    },
    naccounts () {
      console.log('accounts', this.accounts)
      return this.accounts.length
    },
    zero () { return this.naccounts === 0 },
    one () { return this.naccounts === 1 },
    some () { return !this.zero },
    // currentAccount () {
    //   return this.$route.name === 'Account' ? {
    //     user: this.$route.params.user,
    //     servername: this.$route.params.server
    //   } : {}
    // },
    noAccounts () { return this.$route.name === 'ListAccounts' }
  },
  props: ['server'],
  watch: {
    // server: {
    //   immediate: true,
    //   handler (servername, old) {
    //     this.selectOne()
    //   }
    // },
    // $route: {
    //   immediate: true,
    //   handler (to, from) {
    //     console.log('Watch $route', to.name)
    //     if (to && to.params && to.name === 'Account') {
    //       this.selected = this.accounts.find(a => a.serverURL === to.params.server && a.user === to.params.user)
    //     }
    //   }
    // },
    accounts (accounts) {
      console.log('Watch Accounts')
      if (this.selected && this.accountNames.includes(this.selected.name)) return // Do nothing if selected account is already included in the accounts list
      this.change2current() // Otherwise changeTo to current account
    }
  },
  methods: {
    ...mapActions('accounts', ['getCurrentAccount']),
    add () {
      this.$router.push({ name: 'NewAccount', params: { server: this.server } })
    },
    isSelected (account) {
      return account && this.selected && account.name === this.selected.name
    },
    color (account) {
      return this.isSelected(account) ? 'active' : ''
    },
    // load (account) {
    //   if (!account || !account.serverURL || !account.user) return
    //   this.$router.push({ name: 'Account', params: { server: account.serverURL, user: account.user } }).catch(() => {})
    // },
    changeTo (account) {
      if (this.accountNames.includes(account.name)) {
        this.selected = account
      } else {
        this.selected = this.accounts[0]
      }
    },
    async change2current () {
      const current = await this.getCurrentAccount()
      if (current) {
        this.changeTo(current)
      } else { // Else go to selected Account whichever it is
        this.changeTo(this.selected)
      }
    }
    // ,
    // async selectOne () {
    //   console.log('SelectOne')
    //   if (this.selected && this.accounts.find(a => a.name === this.selected.name)) {
    //     console.log('Show previous one')
    //     this.load(this.selected)
    //   } else {
    //     const currentAccount = await this.getCurrentAccount()
    //     if (currentAccount && currentAccount.serverURL === this.server) {
    //       console.log('Go to current Server')
    //       this.load(currentAccount)
    //     } else {
    //       console.log('Go to first account')
    //       this.load(this.accounts[0])
    //     }
    //   }
    // }
  },
  async mounted () {
  },
  beforeUpdate () {
  },
  updated () {
  }
}
</script>
