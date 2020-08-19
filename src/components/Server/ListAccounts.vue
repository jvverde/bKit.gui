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
    some () { return !this.zero }
  },
  props: ['server'],
  watch: {
    $route (to, from) {
      console.log('Watch $route')
      if (this.some && to.name === 'Account' && to.params && to.params.user) {
        console.log('Route to User', to.params.user)
        const selected = this.accounts.find(a => a.user === to.params.user)
        if (selected) {
          console.log('Yes, set select to', selected.address, selected.user)
          this.selected = selected
        } else {
          console.log('NO, go back', this.server)
          this.$router.back()
        }
      } else if (to.name === 'ListAccounts' && from.path.includes(to.path)) {
        // When came back from an account page (on same server), select none
        console.log('Unset selected')
        this.selected = undefined
      }
    },
    server: {
      immediate: true,
      handler (servername) {
        console.log('Watch server')
        console.log('Server change to', servername)
        if (!this.selected || this.selected.address !== servername) this.selectOne()
      }
    },
    selected: {
      immediate: false,
      handler (account) {
        console.log('Watch selected')
        if (!account || !account.user) return
        console.log('Selected change to account:', account.user)
        this.show(account)
      }
    },
    accounts: {
      immediate: false,
      deep: true,
      handler (accounts, old) {
        console.log('Watch Accounts')
        if (!(accounts && old && accounts[0] && old[0] && accounts[0].address === old[0].address)) {
          console.log('Change from a diferent server, so do nothing. Let the others do they work')
        } else if (!this.selected) {
          console.log('No selected yet, so do nothing. Leave it to selectd watch')
        } else if (this.selected.address !== this.server) {
          console.log('Selected still pointed to old server, so do nothing. Leave it to selectd or server watch')
        } else if (accounts.length > old.length) {
          console.log('Detected a new account')
          const index = findNewElePosition(accounts, old)
          console.log('The new element is at position', index)
          this.selected = accounts[index]
        } else if (accounts.find(a => a.user === this.selected.user)) {
          console.log('Selected still pointer to a existing account, so do nothing!!!')
        } else {
          const index = old.findIndex(a => a.user === this.selected.user)
          if (index === -1) {
            console.log('aqui')
            this.selectOne()
          } else if (index >= accounts.length) {
            this.selected = accounts[accounts.length - 1]
          } else {
            this.selected = accounts[index]
          }
        }
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
    show (account) {
      // Show and edit account
      const location = {
        name: 'Account',
        params: {
          server: account.address,
          user: account.user
        }
      }
      const { route } = this.$router.resolve(location)
      console.log('Compare', route.path, this.$route.path)
      if (route.path === this.$route.path) return
      // There are a alternative way to the above check https://stackoverflow.com/a/61111771
      console.log('Go to', route.path)
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
