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
          <div v-if="server && server.address" class="row no-wrap">
            <span>bKit Account:</span>
             <q-btn flat dense no-caps :label="`${server.user}@${server.address}`" :loading="loading">
                <q-menu v-if="accounts.length > 0"
                  transition-show="jump-down"
                  transition-hide="jump-up">
                  <q-list v-for="(account, index) in accounts" :key="index">
                    <q-item clickable dense v-close-popup :active="account.current" @click="changeserver(account)">
                      <q-item-section>{{account.user}}@{{account.address}}</q-item-section>
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
      <keep-alive>
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
const { ipcRenderer, remote: { app } } = require('electron')
import { getUser } from 'src/helpers/bkit'
import { username } from 'src/helpers/bash'
import { catched } from 'src/helpers/notify'
import { mapGetters, mapActions } from 'vuex'
import bkitmenu from 'src/components/Menu'

import { colors } from 'quasar'

colors.setBrand('light', '#DDD')
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
  if (a.address < b.address) return -1
  if (a.address > b.address) return 1
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
    ...mapGetters('global', ['server', 'serversInitialized']),
    loading () { return this.msg && this.msg.length > 0 },
    user () {
      return this.bkituser
        ? this.bkituser === username
          ? username
          : `${username}<i> as </i>${this.bkituser}`
        : `<i>${username}</i>`
    },
    accounts () {
      return [...this.serversInitialized].sort(compare)
    }
  },
  watch: {
    serversInitialized (val) {
      if (val && val.length === 0) {
        this.$router.push({ name: 'servers' })
      }
    }
  },
  components: {
    bkitmenu
  },
  methods: {
    ...mapActions('global', ['setCurrentServer', 'loadCurrentServer', 'loadServers']),
    async changeserver (account) {
      try {
        this.msg = `Change to server ${account.user}@${account.address}`
        await this.setCurrentServer(account)
      } catch (err) {
        catched(err)
      } finally {
        this.msg = undefined
      }
    }
  },
  async mounted () {
    try {
      this.msg = 'Find current server'
      await this.loadCurrentServer()
      this.msg = 'Get local user'
      this.bkituser = await getUser()
      this.msg = 'Loading profiles'
      await this.loadServers()
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
