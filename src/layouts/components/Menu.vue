<template>
  <q-list>
    <q-item-label header>Menu</q-item-label>
    <q-item :clickable="current !== 'home'" @click="$router.push({ name: 'home' })">
      <q-item-section avatar>
        <q-icon color="menu" name="home" />
      </q-item-section>
      <q-item-section>
        <q-item-label>
          Home
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item :clickable="current !== 'backup'" @click="$router.push({ name: 'backup' })">
      <q-item-section avatar>
        <q-icon color="menu" name="backup" />
      </q-item-section>
      <q-item-section>
        <q-item-label>Backup</q-item-label>
        <q-item-label caption>Browse local files</q-item-label>
      </q-item-section>
    </q-item>
    <q-item :clickable="current !== 'servers'" @click="$router.push({ name: 'servers' })">
      <q-item-section avatar>
        <q-icon color="menu" name="storage" />
      </q-item-section>
      <q-item-section>
        <q-item-label>Servers</q-item-label>
        <q-item-label caption>Manage Servers</q-item-label>
      </q-item-section>
    </q-item>
    <q-item :clickable="current !== 'tasks'" @click="$router.push({ name: 'tasks' })">
      <q-item-section avatar>
        <q-icon color="menu" name="assignment" />
      </q-item-section>
      <q-item-section>
          <q-item-label>Tasks</q-item-label>
          <q-item-label caption>Manage Schedule Tasks</q-item-label>
      </q-item-section>
    </q-item>
    <q-item :clickable="current !== 'update'" @click="$router.push({ name: 'update' })">
      <q-item-section avatar>
        <q-icon color="menu" name="system_update_alt" />
      </q-item-section>
      <q-item-section>
        <q-item-label>Update</q-item-label>
        <q-item-label caption>Update GUI and/or client</q-item-label>
      </q-item-section>
    </q-item>
    <q-item clickable @click="terminal">
      <q-item-section avatar>
        <q-icon color="menu" name="fas fa-terminal" />
      </q-item-section>
      <q-item-section>
        <q-item-label>Console</q-item-label>
        <q-item-label caption>Open a BASH shell</q-item-label>
      </q-item-section>
    </q-item>
    <!--
    <q-item clickable @click="$router.push('/customize')">
      <q-item-section avatar>
        <q-icon color="menu" name="tune" />
      </q-item-section>
      <q-item-section>
          <q-item-label>Settings</q-item-label>
          <q-item-label caption>Customize colors</q-item-label>
      </q-item-section>
    </q-item>
    -->
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
  computed: {
    current () {
      return this.$route.name
    }
  },
  watch: {
  },
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
