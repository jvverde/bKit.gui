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
          <q-btn color="ok" flat label="Pull" no-caps @click="pull"/>
        </q-item-section>
        <q-item-section side v-else>
          <q-btn color="ok" flat label="Clone" no-caps @click="clone"/>
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
          <q-btn v-if="bkitok" flat color="ok" label="Reinstall" no-caps @click="setup"/>
          <q-btn v-else color="ok" flat label="Install" no-caps @click="setup"/>
        </q-item-section>
      </q-item>
    </q-list>
    isrepo: {{isRepo}}
    <q-dialog
      v-model="askuser" transition-show="scale" transition-hide="scale">
      <q-card>
        <q-bar>
          <div class="text-warning">{{statement}}</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>
        <q-card-section>
          {{message}}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="ok" v-close-popup />
          <q-btn flat label="Continue" color="danger" @click="goahead" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>

import { mapGetters, mapMutations } from 'vuex'

const { remote: { app, dialog } } = require('electron')
const { install } = require('src/helpers/bash')
const path = require('path')
const isWin = process.platform === 'win32'

const pGit = require('simple-git/promise')
const fs = require('fs')

const isEmpty = (path) => { return fs.readdirSync(path).length === 0 }
const exists = (path) => { return path && fs.existsSync(path) }
const mkdir = (path) => { return fs.mkdirSync(path, { recursive: true }) }

export default {
  name: 'Update',
  data () {
    return {
      askuser: false,
      statement: '',
      message: '',
      goahead: () => false,
      step: 1,
      isWin,
      isRepo: undefined,
      loading: false
    }
  },
  computed: {
    ...mapGetters('global', ['bkitlocation', 'bkitinstalled', 'bkitok']),
    bKitPath: {
      get () { return this.bkitlocation },
      set (path) {
        if (!path) return this.chosebkitLocation()
        if (!exists(path)) mkdir(path)
        this.setbkitLocation(path)
      }
    },
    location () {
      return this.bKitPath || path.normalize(path.join(app.getAppPath(), '../bKit-client'))
    },
    needCheck () {
      return this.bkitinstalled ? this.bkitlocation : false
    },
    needInstall () {
      return !this.bkitok
    },
    git () {
      return pGit(this.bKitPath)
    }
  },
  watch: {
    bkitlocation: {
      immediate: true,
      handler (val) {
        console.log('Check if is repo at', val)
        this.git.checkIsRepo().then(r => {
          console.log('isRepo', r)
          this.isRepo = r
        }).catch(e => console.error(e))
      }
    },
    isRepo (val) {
    },
    bkitinstalled (val) {
      console.log('new bkitinstalled', val)
      if (!val) {
        if (isEmpty(this.location)) {
          console.log('Go clone')
          this.clone()
        } else if (this.isRepo) {
          console.log('Go pull')
          this.pull()
        }
      }
    },
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
      return dialog.showOpenDialog({
        title: 'Select a new location for bKit client',
        defaultPath: dst,
        buttonLabel: 'Choose',
        properties: ['openDirectory', 'promptToCreate']
      }).then((result) => {
        if (result.filePaths instanceof Array) {
          const location = result.filePaths[0]
          if (location !== null) {
            console.log('Set new location on', location)
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
      // const git = require('simple-git')(dst)
      if (!exists(dst)) mkdir(dst)
      if (!isEmpty(dst)) {
        this.askuser = true
        this.statement = 'irectory is not empty'
        this.message = 'Please select a empty dir'
        this.goahead = () => {
          this.chosebkitLocation()
        }
      } else {
        console.log('Clone to', dst)
        this.loading = true
        return this.git.clone('https://github.com/jvverde/bKit.git', dst, ['--depth', 1], (...args) => {
        }).then((...args) => {
          console.log(...args)
          this.loading = false
          this.checkbkitInstalled()
        }).catch(err => {
          console.warn(err)
        })
      }
    },
    pull () {
      if (this.isRepo) {
        return this.git.pull('public', 'master', (...args) => {
          console.log(...args)
        })
      } else {
        console.error('XXXXXXXXXXXXXXXXXX')
      }
    },
    setup () {
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
    checkRepo () {
      if (!this.isRepo) {
        if (!exists(this.location)) return this.chosebkitLocation()
        if (isEmpty(this.location)) {
          console.log('Go to clone')
          // this.clone()
        } else {
          this.askuser = true
          this.statement = `Directory '${this.location}' is not empty`
          this.message = 'Please select a empty dir'
          this.goahead = () => {
            this.askuser = false
            this.chosebkitLocation()
          }
        }
      }
    }
  }
}
</script>
