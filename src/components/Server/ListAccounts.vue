<template>
  <div class="fit relative-position column no-wrap">
    <div class="q-pa-sm q-gutter-x-sm row items-center full-width self-start">
      <div v-show="some">
        Registered account<span v-if="one">s</span> for server {{server}}:
      </div>
      <div v-for="(account, index) in accounts" :key="index">
        <q-chip clickable @click="manage(account)" removable @remove="remove(account)" icon="person">
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

import notify from 'src/mixins/notify'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'ListAccounts',
  data () {
    return {
      loading: false
    }
  },
  computed: {
    ...mapGetters('global', ['getAccountsByServer']),
    accounts () { return this.getAccountsByServer(this.server) },
    sortAccounts () { return [...this.accounts].sort() },
    zero () { return this.accounts.length === 0 },
    one () { return this.accounts.length === 1 },
    some () { return !this.zero }
  },
  props: ['server'],
  mixins: [notify],
  methods: {
    ...mapActions('global', ['delCredentials']),
    add () {
      this.$router.push({ name: 'NewAccount', params: { server: this.server } })
    },
    remove (account) {
      console.log('remove', account)
      if (account.credentials) this.delCredentials(account)
    },
    manage (account) {
      this.$router.push({ name: 'Account', params: { server: this.server, user: account.user } })
    }
  },
  mounted () {
  },
  beforeUpdate () {
  },
  updated () {
  }
}
</script>
