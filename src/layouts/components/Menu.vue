<template>
  <q-list>
    <q-item-label header>Menu</q-item-label>
    <q-item clickable @click="$router.push('/')">
      <q-item-section avatar>
        <q-icon color="menu" name="home" />
      </q-item-section>
      <q-item-section>
        <q-item-label>
          Home
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item clickable @click="$router.push('/backup')">
      <q-item-section avatar>
        <q-icon color="menu" name="backup" />
      </q-item-section>
      <q-item-section>
        <q-item-label>Backup</q-item-label>
        <q-item-label caption>Browse local files</q-item-label>
      </q-item-section>
    </q-item>
    <q-item clickable @click="$router.push('/servers')">
      <q-item-section avatar>
        <q-icon color="menu" name="storage" />
      </q-item-section>
      <q-item-section>
        <q-item-label>Servers</q-item-label>
        <q-item-label caption>Manage Servers</q-item-label>
      </q-item-section>
    </q-item>
    <q-item clickable @click="$router.push('/tasks')">
      <q-item-section avatar>
        <q-icon color="menu" name="assignment" />
      </q-item-section>
      <q-item-section>
          <q-item-label>Tasks</q-item-label>
          <q-item-label caption>Manage Schedule Tasks</q-item-label>
      </q-item-section>
    </q-item>
    <q-item clickable @click="terminal">
      <q-item-section avatar>
        <q-icon color="menu" name="fas fa-terminal" />
      </q-item-section>
      <q-item-section>
        <q-item-label>Console</q-item-label>
        <q-item-label caption>Open a terminal</q-item-label>
      </q-item-section>
    </q-item>
    <q-item clickable @click="debug">
      <q-item-section avatar>
        <q-icon color="menu" name="build" />
      </q-item-section>
      <q-item-section>
        <q-item-label>DevTools</q-item-label>
        <q-item-label caption>Open Developer Tools</q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script>

const { ipcRenderer } = require('electron')
import { shell } from 'src/helpers/bash'

export default {
  name: 'Menu',
  methods: {
    terminal () {
      shell()
    },
    debug () {
      ipcRenderer.send('debug', 'on')
    }
  }
}
</script>

<style scoped lang="scss">
</style>
