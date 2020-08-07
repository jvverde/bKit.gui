<template>
  <div class="q-pa-sm q-gutter-x-sm row items-center full-width self-start">
    <div>Registered account(s) for server {{server}}:</div>
    <div v-for="(account, index) in accounts" :key="index">{{account}}</div>
    <div style="margin-left:auto" class="q-my-sm">
      <q-btn icon="add" label="New Account" no-caps dense @click="add"/>
    </div>
  </div>
</template>

<script>

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
      }
    }
  },
  methods: {
    add () {
      this.$router.push(`/servers/${this.server}/new/account`)
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
