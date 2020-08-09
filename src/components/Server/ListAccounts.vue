<template>
  <div class="q-pa-sm q-gutter-x-sm row items-center full-width self-start">
    <div v-show="some">
      Registered account<span v-if="one">s</span> for server {{server}}:
    </div>
    <div v-for="(account, index) in accounts" :key="index">
      <q-chip clickable @click="manage(account)" removable @remove="remove(account)" icon="person">
        {{account}}
      </q-chip>
    </div>
    <div v-if="some" style="margin-left:auto" class="q-my-sm">
      <q-btn icon="add" label="New Account" no-caps dense @click="add"/>
    </div>
    <div v-else class="absolute-center column items-center q-gutter-x-sm">
      <div class="text-h6">No accounts</div>
      <div>You don't have any account configured for server {{server}}</div>
      <div>Please add a new one</div>
      <q-btn class="q-mt-xl" icon="add" outline rounded label="New Account" no-caps @click="add"/>
    </div>
    <q-inner-loading :showing="loading">
      <q-spinner-ios size="xl" color="loader"/>
    </q-inner-loading>
  </div>
</template>

<script>

import notify from 'src/mixins/notify'
import { getAccounts, deleteAccount } from 'src/helpers/credentials'

export default {
  name: 'ListAccounts',
  data () {
    return {
      loading: false,
      accounts: []
    }
  },
  computed: {
    zero () { return this.accounts.length === 0 },
    one () { return this.accounts.length === 1 },
    some () { return !this.zero }
  },
  props: ['server'],
  watch: {
    server: {
      immediate: true,
      async handler (val) {
        this.loading = true
        try {
          const accounts = await getAccounts()
          this.accounts = accounts.filter(u => u.endsWith(`@${val}`))
            .map(u => u.replace(/@[^@]+$/, ''))
        } catch (err) {
          this.catch(err)
        } finally {
          this.loading = false
        }
      }
    }
  },
  mixins: [notify],
  methods: {
    add () {
      this.$router.push({ name: 'NewAccount', params: { server: this.server } })
    },
    remove (account) {
      deleteAccount(`${account}@${this.server}`)
        .then(() => {
          const index = this.accounts.findIndex(u => u === account)
          if (index < 0) return
          console.log('remove index', index)
          this.accounts.splice(index, 1)
        })
        .catch(this.catch)
    },
    manage (account) {
      console.log(account)
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
