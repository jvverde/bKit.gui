<template>
  <q-page padding class="q-pa-lg column relative fit">
    <div class="q-mb-xl self-center">This app is a GUI for the bKit Client.</div>
    <div>
      <span>Here we may change the bKit Client location, download or update it from the public repository</span>
      <span v-if="isWin">and install cygwin and packages as well other underlying apps</span>
    </div>
    <div>
      We may do it manually one by one or just let it install
      <q-btn color="ok" flat dense label="automatically" no-caps @click="setup"/>
    </div>
    <q-list padding class="absolute-center">
      <q-item>
        <q-item-section side>
          <q-item-label>Locatiom:</q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{location}}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn color="ok" flat label="Change" no-caps @click="chosebkitLocation"/>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section side>
          <q-item-label>Bkit Client is present:</q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{bkitinstalled}}</q-item-label>
        </q-item-section>
        <q-item-section side v-if="bkitinstalled">
          <q-btn color="ok" flat label="Update" no-caps @click="pull"/>
        </q-item-section>
        <q-item-section side v-else>
          <q-btn color="ok" flat label="Download" no-caps @click="clone"/>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section side>
          <q-item-label>Bkit Client is installed:</q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{bkitok}}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn v-if="bkitok" flat color="ok" label="Reinstall" no-caps @click="install"/>
          <q-btn v-else color="ok" flat label="Install" no-caps @click="install"/>
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script>

import { mapGetters, mapMutations } from 'vuex'

const { remote: { app, dialog } } = require('electron')
const { install } = require('src/helpers/bash')
const path = require('path')
const isWin = process.platform === 'win32'

export default {
  name: 'Update',
  data () {
    return {
      step: 1,
      isWin,
      loading: false
    }
  },
  computed: {
    ...mapGetters('global', ['bkitlocation', 'bkitinstalled', 'bkitok']),
    bKitPath: {
      get () { return this.bkitlocation },
      set (val) { this.setbkitLocation(val) }
    },
    location () {
      return this.bKitPath || path.normalize(path.join(app.getAppPath(), '../'))
    },
    needCheck () {
      return this.bkitinstalled ? this.bkitlocation : false
    },
    needInstall () {
      return !this.bkitok
    }
  },
  watch: {
    needCheck (val) {
      if (val) {
        console.log('bkitisok?', this.bkitok)
      }
    }
  },
  methods: {
    ...mapMutations('global', ['setbkitLocation', 'checkbkitInstalled', 'checkbkitOk']),
    chosebkitLocation () {
      const dst = this.location
      console.log('dst', dst)
      dialog.showOpenDialog({
        title: 'Select a new location for bKit client',
        defaultPath: dst,
        buttonLabel: 'Choose',
        properties: ['openDirectory', 'promptToCreate']
      }).then((result) => {
        if (result.filePaths instanceof Array) {
          const location = result.filePaths[0]
          if (location !== null) {
            this.bKitPath = location
          }
        }
      }).catch((err) => {
        console.error('Catch on showOpenDialog', err)
      }).finally(() => {
        // console.log('')
      })
    },
    clone () {
      const dst = this.bKitPath
      const git = require('simple-git')(dst)
      git.silent(false)
      console.log('clone to', dst)
      this.loading = true
      git.clone('https://github.com/jvverde/bKit.git', dst, (...args) => {
        console.log(...args)
        this.loading = false
        this.checkbkitInstalled()
      })
    },
    pull () {
      const git = require('simple-git')(this.bKitPath)
      git.pull('public', 'master', (...args) => {
        console.log(...args)
      })
    },
    install () {
      if (isWin) {
        const onreaddata = (data) => console.log('data:', data.toString())
        const onreaderror = (data) => console.warn('error:', data.toString())
        const onclose = (code) => this.postinstall(code)
        install({
          onreaddata,
          onreaderror,
          onclose
        })
      }
    },
    postinstall (code) {
      if (0 | code === 0) {
        this.checkbkitOk()
      }
    },
    setup () {
      // if (!bkitinstalled)
    }
  }
}
</script>
