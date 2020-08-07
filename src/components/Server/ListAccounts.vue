<template>
  <div class="q-pa-sm q-gutter-x-sm row items-center full-width self-start">
    <div>Registered account<span v-if="accounts.length > 1">s</span> for server {{server}}:</div>
    <div v-for="(account, index) in accounts" :key="index">
      <q-chip clickable @click="manage(account)" removable @remove="remove(account)" icon="person">
        {{account}}
      </q-chip>
    </div>
    <div style="margin-left:auto" class="q-my-sm">
      <q-btn icon="add" label="New Account" no-caps dense @click="add"/>
    </div>
  </div>
</template>

<script>

import notify from 'src/mixins/notify'

const keytar = require('keytar')

export default {
  name: 'ListAccounts',
  data () {
    return {
      accounts: []
    }
  },
  props: ['server'],
  watch: {
    server: {
      immediate: true,
      handler (val) {
        keytar.findCredentials('bKit')
          .then((creds = []) => {
            this.accounts = creds
              .map(c => c.account)
              .filter(u => u.endsWith(`@${val}`))
              .map(u => u.replace(/@[^@]+$/, ''))
          })
          .catch(this.catch)
      }
    }
  },
  mixins: [notify],
  methods: {
    add () {
      this.$router.push(`/servers/${this.server}/new/account`)
    },
    remove (account) {
      keytar.deletePassword('bKit', `${account}@${this.server}`)
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
