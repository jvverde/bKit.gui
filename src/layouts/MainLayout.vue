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
      <keep-alive v-if="server || $route.name === 'Servers'">
        <router-view/>
      </keep-alive>
      <q-page v-else padding class="relative flex flex-center" style="height:100vh;width:100vw">
        <div class="absolute-center column flex-center">
          <img alt="bKit logo" src="~assets/logotipo.svg"
            @click="$router.push('/servers')"
            style="width:50%;height:50%;cursor:pointer">
          <div>Please select a server on left menu</div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>

const os = require('os')
const { ipcRenderer, remote: { app } } = require('electron')
import { getServer, getUser } from 'src/helpers/bkit'
import { username } from 'src/helpers/bash'
import { mapState, mapMutations } from 'vuex'
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
  components: {
    bkitmenu
  },
  computed: {
    ...mapState('global', {
      storedserver: state => state.server
    }),
    server: {
      get () {
        return this.storedserver
      },
      set (server) {
        this.setServer(server)
      }
    },
    user () {
      return this.bkituser === username ? username : `${username} <i>as</i> ${this.bkituser || '...'}`
    }
  },
  async mounted () {
    this.server = await getServer()
    this.bkituser = await getUser()
  },
  methods: {
    ...mapMutations('global', ['setServer'])
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
