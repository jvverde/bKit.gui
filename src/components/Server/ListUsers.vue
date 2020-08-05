<template>
  <div>
    Registered user(s):
    <span v-for="(user, index) in users" :key="index">{{user}}</span>
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
  methods: {
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
