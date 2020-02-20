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
            <q-item-label>
              <router-link tag="span" to="/restore">
                Restore
              </router-link>
            </q-item-label>
            <q-item-label caption>Browse backups</q-item-label>
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
import * as bkit from 'src/helpers/bkit'

ipcRenderer.on('message', (event, text) => {
  console.log('Event:', event)
  console.log('Message:', text)
})

export default {
  name: 'MainLayout',

  data () {
    return {
      leftDrawerOpen: false,
      user: bkit.user(),
      version: app.getVersion(),
      hostname: os.hostname(),
      server: ''
    }
  },
  mounted () {
    bkit.bash('./server.sh', [], {
      onclose: () => console.log('Close server'),
      onreadline: (data) => {
        console.log('Server:', data)
        const name = (`${data}` || '').replace(/(\n|\r)+$/g, '').replace(/\|/g, '.')
        this.$nextTick(() => {
          this.server = name
          // this.$router.push('/server')
        })
      }
    })
  },
  methods: {
    terminal () {
      bkit.shell()
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
