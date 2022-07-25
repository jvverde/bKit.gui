<template>
  <div>
    <span v-html="user"/> @ {{hostname}}
    <!--span>{{currentClient.user}}@{{currentClient.name}}</span-->
  </div>
</template>

<script>
const os = require('os')
const username = os.userInfo().username

import { pInfo } from 'src/boot/computer'
import { catched } from 'src/helpers/notify'
import { mapGetters } from 'vuex'

export default {
  name: 'User',

  data () {
    return {
      hostname: os.hostname(),
      computer: {
        name: undefined,
        domain: undefined,
        uuid: undefined,
        user: undefined
      }
    }
  },
  computed: {
    ...mapGetters('clients', ['getCurrentClient']),
    user () {
      return this.localUser
        ? this.localUser === username
          ? username
          : `${username}<i> as </i>${this.localUser}`
        : `<i>${username}</i>`
    }
  },
  watch: {
  },
  components: {
  },
  methods: {
  },
  async mounted () {
    try {
      // this.msg = 'Get local computer'
      const { computer, localUser: user } = await pInfo
      this.localUser = user
      this.computer = { ...computer, user }
    } catch (err) {
      catched(err)
    } finally {
      // this.msg = undefined
    }
  }
}
</script>

<style scoped lang="scss">
</style>
