<template>
  <q-layout view="hHh Lpr fFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          icon="menu"
          aria-label="Menu"
        />

        <q-toolbar-title>
          bKit at {{server}}
        </q-toolbar-title>

        <div>{{user}}@{{hostname}} | v{{version}}</div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      overlay
      bordered
      content-class="bg-grey-2"
    >
      <q-list>
        <q-item-label header>Menu</q-item-label>
        <q-item clickable>
          <q-item-section avatar>
            <q-icon color="primary" name="home" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <router-link tag="span" to="/">
                Home
              </router-link>
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable>
          <q-item-section avatar>
            <q-icon color="primary" name="restore" />
          </q-item-section>
          <q-item-section>
            <router-link tag="span" to="/restore">
              <q-item-label>Restore</q-item-label>
              <q-item-label caption>Browse backups</q-item-label>
            </router-link>
          </q-item-section>
        </q-item>
        <q-item clickable>
          <q-item-section avatar>
            <q-icon color="primary" name="backup" />
          </q-item-section>
          <q-item-section>
            <router-link tag="span" to="/backup">
              <q-item-label>Backup</q-item-label>
              <q-item-label caption>Browse local files</q-item-label>
            </router-link>
          </q-item-section>
        </q-item>
        <q-item clickable>
          <q-item-section avatar>
            <q-icon color="primary" name="backup" />
          </q-item-section>
          <q-item-section>
            <router-link tag="span" to="/servers">
              <q-item-label>Servers</q-item-label>
              <q-item-label caption>Manage Servers</q-item-label>
            </router-link>
          </q-item-section>
        </q-item>
        <q-item clickable @click="terminal">
          <q-item-section avatar>
            <q-icon color="primary" name="fas fa-terminal" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Console</q-item-label>
            <q-item-label caption>Open a terminal</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable @click="debug">
          <q-item-section avatar>
            <q-icon color="primary" name="build" />
          </q-item-section>
          <q-item-section>
            <q-item-label>DevTools</q-item-label>
            <q-item-label caption>Open Developer Tools</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
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
import { getServer } from 'src/helpers/bkit'
import { user, shell } from 'src/helpers/bash'

ipcRenderer.on('message', (event, text) => {
  console.log('Event:', event)
  console.log('Message:', text)
})

export default {
  name: 'MainLayout',

  data () {
    return {
      leftDrawerOpen: false,
      user: user(),
      version: app.getVersion(),
      hostname: os.hostname(),
      server: ''
    }
  },
  mounted () {
    getServer()
      .then(data => {
        console.log('Server:', data)
        const name = data instanceof Array ? data[0] : `${data}`
        this.server = name
      })
  },
  methods: {
    terminal () {
      console.log('open a shell')
      shell()
    },
    debug () {
      console.log('open debug window')
      ipcRenderer.send('debug', 'on')
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
