<template>
  <q-layout view="hHh Lpr fFf" style="height: 100vh; width: 100vw">
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
          <div v-if="account.name" class="row no-wrap">
            <span>bKit Account:</span>
             <q-btn flat dense no-caps :label="`${account.name}`" :loading="loading">
                <q-menu v-if="accounts.length > 0"
                  transition-show="jump-down"
                  transition-hide="jump-up">
                  <q-list v-for="(account, index) in accounts" :key="index">
                    <q-item clickable dense v-close-popup :active="account.current" @click="changeserver(account)">
                      <q-item-section>{{account.name}}</q-item-section>
                      <q-item-section side v-if="account.current">
                        <q-icon name="done" color="active"/>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
             </q-btn>
          </div>
        </q-toolbar-title>
        <div style="margin-left:auto">
          <q-btn v-show="!bempty" color="button" icon="cloud_circle" dense flat @click="btoggle"/>
        </div>
        <div style="margin-left:auto">
          <q-btn v-show="!rempty" color="button" icon="restore_page" dense flat @click="rtoggle"/>
        </div>
        <clients class="q-mr-md q-my-xs"/>
        <user/>
        <div style="margin-left: 1em;">
          <q-btn icon="home" dense flat @click="$router.push({ name: 'home' })"/>
        </div>
        <info/>
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
    <!-- q-inner-loading :showing="loading">
      <q-spinner-ios size="xl" color="loader"/>
      <span>{{msg}}</span>
    </q-inner-loading>
    <backupProgress/>
    <restoreProgress/ -->
  </q-layout>
</template>

<script>

// import info from 'src/helpers/info'
import { catched } from 'src/helpers/notify'
import { mapGetters, mapMutations, mapActions } from 'vuex'
import bkitmenu from './components/Menu'
// import backupProgress from 'src/workers/backup/BackupProgress'
// import restoreProgress from 'src/workers/restore/RestoreProgress'
import clients from './components/Clients'
import user from './components/User'
import info from './components/Info'

// import { colors } from 'quasar'

// colors.setBrand('light', '#DDD')
// colors.setBrand('missing', '#F30')
// console.log(colors)

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
      leftDrawerOpen: false
    }
  },
  computed: {
     ...mapGetters('accounts', ['account', 'currentProfiles']),
     ...mapGetters('backups', { bempty: 'empty' }),
     ...mapGetters('restore', { rempty: 'empty' }),
    // loading () { return this.msg && this.msg.length > 0 },
    // accounts () {
    //   return [...this.currentProfiles].sort(compare)
    // }
  },
  watch: {
    currentProfiles (val) {
      if (val && val.length === 0) {
        this.$router.push({ name: 'servers' })
      }
    }
  },
  components: {
    bkitmenu,
    // backupProgress,
    // restoreProgress,
    clients,
    user,
    info
  },
  methods: {
    ...mapActions('accounts', ['setCurrentAccount']),
    ...mapMutations('backups', { btoggle: 'toggle' }),
    ...mapMutations('restore', { rtoggle: 'toggle' }),
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
    console.log('MOUNTED', compare)
    const onreadline = (i) => console.log('readline', i)
    window.electron.bash('./listdisks.sh', [], { onreadline })
    window.electron.bash('./server.sh', ['-r'], { onreadline })
  }
}
</script>

<style scoped lang="scss">
  .bkit-container {
    display: flex;
    flex-direction: column;
    height:100%;
    width: 100%;
  }
  .foreign {
    color: $red-9
  }
</style>
