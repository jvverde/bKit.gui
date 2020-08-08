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
          <span v-if="server">
            bKit at {{server}}
          </span>
        </q-toolbar-title>

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
  </q-layout>
</template>

<script>

const os = require('os')
const { ipcRenderer, remote: { app } } = require('electron')
import { getServer, getUser } from 'src/helpers/bkit'
import { username } from 'src/helpers/bash'
import { mapMutations, mapGetters } from 'vuex'
import bkitmenu from './components/Menu'

import { colors } from 'quasar'

colors.setBrand('light', '#DDD')
// colors.setBrand('missing', '#F30')
// console.log(colors)

ipcRenderer.on('message', (event, text) => {
  console.log('Event:', event)
  console.log('Message:', text)
})

export default {
  name: 'MainLayout',

  data () {
    return {
      leftDrawerOpen: false,
      bkituser: undefined,
      version: app.getVersion(),
      hostname: os.hostname()
    }
  },
  computed: {
    ...mapGetters('global', ['bkitok', 'server']),
    currentserver: {
      get () { return this.server },
      set (server) { this.setbkitServer(server) }
    },
    user () {
      return this.bkituser
        ? this.bkituser === username
          ? username
          : `${username}<i> as </i>${this.bkituser}`
        : `<i>${username}</i>`
    }
  },
  components: {
    bkitmenu
  },
  methods: {
    ...mapMutations('global', ['setbkitServer'])
  },
  mounted () {
    getServer().then((server) => { this.currentserver = server })
    getUser().then((user) => { this.bkituser = user })
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
