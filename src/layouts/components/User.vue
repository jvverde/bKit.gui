<template>
  <div class="column no-wrap items-center">
    <div><span v-html="user"/> @ {{hostname}}</div>
    <div v-if="onBehalf" class="onbehalf">on behalf of {{onBehalf}}</div>
  </div>
</template>

<script>
const os = window.electron.os
console.log(os)
const username = os.userInfo.username

import { pInfo } from 'src/boot/computer'
import { catched } from 'src/helpers/notify'
import { mapGetters } from 'vuex'

const isSameComputer = (a, b) => a.name === b.name && a.domain === b.domain && a.uuid === b.uuid && a.user === b.user

export default {
  name: 'User',
  data () {
    return {
      hostname: os.hostname,
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
    },
    onBehalf () {
      const current = this.getCurrentClient
      const answer = !current.uuid || isSameComputer(this.computer, current) ? false : `${current.user}@${current.name}`
      return answer
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
  @import 'src/css/app.scss';
  .onbehalf {
    color: $foreign
  }
</style>
