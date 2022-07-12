<template>
  <q-list>
    <q-item-label header>Menu</q-item-label>
    <q-item :clickable="current !== 'home'" @click="$router.push({ name: 'home' })">
      <q-item-section avatar>
        <q-icon color="menu" name="las la-home" />
      </q-item-section>
      <q-item-section>
        <q-item-label>
          Home
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item :clickable="current !== 'backup'" @click="$router.push({ name: 'backup' })">
      <q-item-section avatar>
        <q-icon color="menu" name="las la-cloud" />
      </q-item-section>
      <q-item-section>
        <q-item-label>Disks & Backups</q-item-label>
        <q-item-label caption>Browse local and backups</q-item-label>
      </q-item-section>
    </q-item>
    <q-item :clickable="current !== 'servers'" @click="$router.push({ name: 'servers' })">
      <q-item-section avatar>
        <q-icon color="menu" name="las la-server"/>
      </q-item-section>
      <q-item-section>
        <q-item-label>Servers</q-item-label>
        <q-item-label caption>Manage Accounts</q-item-label>
      </q-item-section>
    </q-item>
    <q-item :clickable="current !== 'tasks'" @click="$router.push({ name: 'tasks' })">
      <q-item-section avatar>
        <q-icon color="menu" name="las la-tasks" />
      </q-item-section>
      <q-item-section>
          <q-item-label>Tasks</q-item-label>
          <q-item-label caption>Manage Schedule Tasks</q-item-label>
      </q-item-section>
    </q-item>
    <!--
    <q-item :clickable="current !== 'update'" @click="$router.push({ name: 'update' })">
      <q-item-section avatar>
        <q-icon color="menu" name="system_update_alt" />
      </q-item-section>
      <q-item-section>
        <q-item-label>Update</q-item-label>
        <q-item-label caption>Update GUI and/or client</q-item-label>
      </q-item-section>
    </q-item>
    -->
    <q-item clickable @click="showBackupList">
      <q-item-section avatar>
        <q-icon color="menu" name="las la-list-alt"/>
      </q-item-section>
      <q-item-section>
        <q-item-label>Backups in Progress</q-item-label>
        <q-item-label caption>Show Backup List</q-item-label>
      </q-item-section>
    </q-item>
    <q-item clickable @click="terminal">
      <q-item-section avatar>
        <q-icon color="menu" name="las la-terminal" />
      </q-item-section>
      <q-item-section>
        <q-item-label>Console</q-item-label>
        <q-item-label caption>Open a BASH shell</q-item-label>
      </q-item-section>
    </q-item>
    <!--q-item clickable @click="$router.push('/customize')">
      <q-item-section avatar>
        <q-icon color="menu" name="tune" />
      </q-item-section>
      <q-item-section>
          <q-item-label>Settings</q-item-label>
          <q-item-label caption>Customize colors</q-item-label>
      </q-item-section>
    </q-item-->
    <q-item clickable @click="debug">
      <q-item-section avatar>
        <q-icon color="menu" name="las la-toolbox" />
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
import { mapMutations } from 'vuex'

export default {
  name: 'Menu',
  data () {
    return {
      tools: false
    }
  },
  computed: {
    current () {
      return this.$route.name
    }
  },
  watch: {
  },
  methods: {
    ...mapMutations('backups', { showBackupList: 'show' }),
    terminal () {
      shell()
    },
    debug () {
      this.tools = !this.tools
      if (this.tools) {
        ipcRenderer.send('debug', 'on')
      } else {
        ipcRenderer.send('debug', 'off')
      }
    }
  }
}
</script>

<style scoped lang="scss">
</style>
