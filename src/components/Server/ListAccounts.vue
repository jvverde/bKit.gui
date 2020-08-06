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

// import { mapGetters } from 'vuex'

const keytar = require('keytar')

export default {
  name: 'ServerUsers',
  data () {
    return {
      accounts: []
    }
  },
  props: ['server'],
  methods: {
    add () {
      this.$router.push(`/servers/${this.server}/new/account`)
    }
  },
  mounted () {
    keytar.findCredentials('bKit')
      .then((creds = []) => {
        creds.map(c => c.account).forEach(u => {
          this.accounts.push(u)
        })
      })
  }
}
</script>
