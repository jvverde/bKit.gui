<template>
  <q-layout view="hHh Lpr fFf">
    <q-header elevated class="bg-toolbar">
      <q-toolbar>
        <q-btn
          flat
          dense
          @click="leftDrawerOpen = !leftDrawerOpen"
          icon="menu"
          aria-label="Menu"
        />

        <q-toolbar-title>
          <div v-if="account && account.servername" class="row no-wrap">
            <span>bKit Account:</span>
             <q-btn flat dense no-caps :label="`${account.user}@${account.servername}`" :loading="loading">
                <q-menu v-if="accounts.length > 0"
                  transition-show="jump-down"
                  transition-hide="jump-up">
                  <q-list v-for="(account, index) in accounts" :key="index">
                    <q-item clickable dense v-close-popup :active="account.current" @click="changeserver(account)">
                      <q-item-section>{{account.user}}@{{account.servername}}</q-item-section>
                      <q-item-section side v-if="account.current">
                        <q-icon name="done" color="active"/>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
             </q-btn>
          </div>
        </q-toolbar-title>
        <div style="margin-right: 1em;">
          <q-btn icon="home" dense flat @click="$router.push({ name: 'home' })"/>
        </div>
        <div><span v-html="user"/> @ {{hostname}} | v{{version}}</div>
      </q-toolbar>
    </q-header>
    <q-drawer v-model="leftDrawerOpen" bordered content-class="bg-menu">
      <bkitmenu/>
    </q-drawer>
    <q-page-container class="bkit-container">
      <keep-alive include="backup">
        <router-view/>
      </keep-alive>
    </q-page-container>
    <q-inner-loading :showing="loading">
      <q-spinner-ios size="xl" color="loader"/>
      <span>{{msg}}</span>
    </q-inner-loading>
  </q-layout>
</template>

<script>
const os = require('os')
const username = os.userInfo().username

const { ipcRenderer, remote: { app } } = require('electron')
// import info from 'src/helpers/info'
import { pInfo } from 'src/boot/computer'
import { catched } from 'src/helpers/notify'
import { mapGetters, mapActions } from 'vuex'
import bkitmenu from './components/Menu'

// import { colors } from 'quasar'

// colors.setBrand('light', '#DDD')
// colors.setBrand('missing', '#F30')
// console.log(colors)

ipcRenderer.on('message', (event, text) => {
  console.log('Event:', event)
  console.log('Message:', text)
})

const compareByUser = (a, b) => {
  if (a.user < b.user) return -1
  if (a.user > b.user) return 1
  return 0
}
const compareByAddr = (a, b) => {
  if (a.servername < b.servername) return -1
  if (a.servername > b.servername) return 1
  return compareByUser(a, b)
}
const compare = compareByAddr

export default {
  name: 'MainLayout',

  data () {
    return {
      msg: undefined,
      leftDrawerOpen: false,
      bkituser: undefined,
      version: app.getVersion(),
      hostname: os.hostname()
    }
  },
  computed: {
    ...mapGetters('accounts', ['currentProfiles']),
    loading () { return this.msg && this.msg.length > 0 },
    user () {
      return this.bkituser
        ? this.bkituser === username
          ? username
          : `${username}<i> as </i>${this.bkituser}`
        : `<i>${username}</i>`
    },
    accounts () {
      return [...this.currentProfiles].sort(compare)
    }
  },
  watch: {
    currentProfiles (val) {
      if (val && val.length === 0) {
        this.$router.push({ name: 'servers' })
      }
    }
  },
  components: {
    bkitmenu
  },
  methods: {
    ...mapActions('accounts', ['setCurrentAccount']),
    async changeserver (account) {
      try {
        this.msg = `Change to account ${account.user}@${account.servername}`
        await this.setCurrentAccount(account)
      } catch (err) {
        catched(err)
      } finally {
        this.msg = undefined
      }
    }
  },
  async mounted () {
    try {
      this.msg = 'Get local user'
      const { bkituser } = await pInfo
      this.bkituser = bkituser
    } catch (err) {
      catched(err)
    } finally {
      this.msg = undefined
    }
  }
}
</script>

<style scoped lang="scss">
  .bkit-container {
    display: flex;
    flex-direction: column;
    height:100vh;
    width: 100vw;
  }
</style>
