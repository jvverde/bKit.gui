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
----- BEGIN LICENSE -----
Serprest, Lda
Single User License
EA7E-1138123
130F5808 F27A5A64 43629D2A 9E8FA653
7C4F9154 A7403111 26A1E9D5 F7309C05
DBF9E96F CD1D222E AFB91127 39932DDA
C5CDEF0E 9BA52E07 94B311A3 F892E9E3
4D44F00B 23588D05 7804C1E0 70559F3D
F1E05784 DD763FCF 5410473F D3A210C4
940D6C1E 9A474745 72463945 9FE18505
5C81DBBF CEC61721 F8AD4DB0 78E1E26C
------ END LICENSE ------
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
            <q-icon name="home" />
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
            <q-icon name="backup" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <router-link tag="span" to="/restore">
                Restore
              </router-link>
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable @click="debug">
          <q-item-section avatar>
            <q-icon name="build" />
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

ipcRenderer.on('message', (event, text) => {
  console.log('Event:', event)
  console.log('Message:', text)
})

import * as bkit from 'src/helpers/bkit'

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
