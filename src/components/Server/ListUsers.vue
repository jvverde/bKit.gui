<template>
  <div class="q-pa-xl q-gutter-x-sm row items-center full-width self-start">
    <div>Registered user(s) for server {{server}}:</div>
    <div v-for="(user, index) in users" :key="index">{{user}}</div>
    <div style="margin-left:auto" class="q-my-sm">
      <q-btn icon="add" label="New User" no-caps  @click="add"/>
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
      users: []
    }
  },
  props: ['server'],
  methods: {
    add () {
      this.$router.push(`/servers/${this.server}/new/user`)
    }
  },
  mounted () {
    keytar.findCredentials('bKit')
      .then((creds = []) => {
        creds.map(c => c.account).forEach(u => {
          this.users.push(u)
        })
      })
  }
}
</script>
