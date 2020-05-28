<template>
  <q-page padding class="q-pa-lg column relative fit">
    <div class="q-mb-xl self-center">This app is a GUI for the bKit Client.</div>
    <div>
      <span>Here we may change the bKit Client location, download or update it from the public repository</span>
      <span v-if="isWin">and install cygwin and packages as well other underlying apps</span>
    </div>
    <div>
      We may do it manually one by one or just let it <span v-if="bkitok">re</span>install
      <q-btn color="ok" flat dense label="automatically" no-caps @click="install"/>
    </div>
    <div>
      However, we probably don't need to worry as everything will be done automatically the first time we arrive to this page. Just use in case of some troubles.
    </div>
    <q-list padding class="absolute-center">
      <q-item>
        <q-item-section side>
          <q-item-label>Locatiom:</q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{bKitPath}}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn :disable="disable" color="ok" flat label="Change" no-caps @click="chosebkitLocation"/>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section side>
          <q-item-label>bKit Client is installed:</q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{bkitinstalled}}</q-item-label>
        </q-item-section>
        <q-item-section side v-if="bkitinstalled" no-wrap>
          <q-btn :disable="disable" color="ok" flat label="Reset" no-caps @click="resetRepo"/>
          <q-btn :disable="disable" :loading="updating" color="ok" flat label="Update" no-caps @click="updateRepo"/>
        </q-item-section>
        <q-item-section side v-else>
          <q-btn :disable="disable" :loading="installing" color="ok" flat label="Install" no-caps @click="install"/>
        </q-item-section>
      </q-item>
      <q-item v-if="bkitinstalled">
        <q-item-section side>
          <q-item-label>bKit Client is runnable:</q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{bkitok}}</q-item-label>
        </q-item-section>
        <q-item-section side v-if="isWin">
          <q-btn :disable="disable" :loading="setuping" color="ok" flat label="Setup" no-caps @click="winSetup"/>
        </q-item-section>
      </q-item>
    </q-list>
    <q-dialog
      @hide="hide"
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

import { ipcRenderer } from 'electron'

const { remote: { dialog } } = require('electron')
const { winInstall } = require('src/helpers/bash')
const path = require('path')
const isWin = process.platform === 'win32'

const pGit = require('simple-git/promise')
const fs = require('fs')

const isEmpty = (path) => { return fs.readdirSync(path).length === 0 }
const exists = (path) => { return path && fs.existsSync(path) }
const mkdir = (path) => { return fs.mkdirSync(path, { recursive: true }) }

const nill = () => false

const defaultPath = ipcRenderer.sendSync('getbKitPath')

const chosebkitLocation = (path = defaultPath) => {
  return dialog.showOpenDialog({
    title: 'Select a new location for bKit client',
    defaultPath: path,
    buttonLabel: 'Choose',
    // properties: ['openDirectory', 'promptToCreate']
    properties: ['openDirectory']
  }).then((result) => {
    console.log('result', result)
    if (result.canceled) return false
    else if (result.filePaths instanceof Array) {
      return result.filePaths[0]
    } else return null
  })
}

export default {
  name: 'Update',
  data () {
    return {
      askuser: false,
      statement: '',
      message: '',
      goahead: nill,
      hide: nill,
      step: 1,
      isWin,
      cloning: false,
      updating: false,
      setuping: false,
      installing: false
    }
  },
  computed: {
    ...mapGetters('global', ['bkitlocation', 'bkitinstalled', 'bkitok']),
    bKitPath: {
      get () { return this.bkitlocation },
      async set (path) {
        if (!path) return this.chosebkitLocation()
        if (!exists(path)) await this.mkdir(path)
        this.setbkitLocation(path)
      }
    },
    disable () { return this.cloning || this.updating || this.setuping || this.installing },
    needAttention () {
      const { bkitlocation, bkitinstalled, bkitok } = this
      return {
        bkitlocation,
        bkitinstalled,
        bkitok
      }
    },
    git () {
      return pGit(this.bKitPath)
    }
  },
  watch: {
    needAttention: {
      immediate: true,
      deep: true,
      async handler (val) {
        console.log('needAttention', val)
        const { bkitlocation, bkitinstalled, bkitok } = this
        if (!bkitlocation) {
          this.chosebkitLocation()
        } else if (!exists(bkitlocation)) {
          await this.mkdir(bkitlocation)
          this.setupRepo()
        } else if (!bkitinstalled) {
          this.setupRepo()
        } else if (isWin && !bkitok) {
          this.winSetup()
        }
      }
    }
  },
  methods: {
    ...mapMutations('global', ['setbkitLocation', 'checkbkitInstalled', 'checkbkitOk']),
    mkdir (fullname) {
      try {
        const parent = path.dirname(fullname)
        fs.accessSync(parent, fs.constants.W_OK)
        console.log('I can write on %s', parent)
        return mkdir(fullname)
      } catch (err) {
        console.log("%s doesn't allow you to create directory", path)
        return this.chosebkitLocation()
      }
    },
    chosebkitLocation (defaultPath) {
      const dst = this.bKitPath || defaultPath
      return chosebkitLocation(dst)
        .then((location) => {
          if (location) this.bKitPath = location
          return location
        })
        .catch((err) => {
          console.error('Catch on showOpenDialog:', err)
        })
        .finally(() => {
          // console.log('')
        })
    },
    whenNotEmpty (location = this.bKitPath) {
      return new Promise((resolve, reject) => {
        this.askuser = true
        this.message = `Directory '${location}' is not empty`
        this.statement = 'Please select a empty dir'
        this.goahead = async () => {
          this.hide = nill
          const newlocation = await this.chosebkitLocation()
          if (!newlocation) reject('New location wasn\'t "Selected"')
          else if (location === newlocation) resolve(this.whenNotEmpty(location))
          else resolve(newlocation)
        }
        this.hide = () => reject('Ask for new location was "Canceled"')
      }).then(() => {
        console.log('Reset dialog handlers')
        this.goahead = this.hide = nill
      })
    },
    async checkRepo () {
      console.log('Check if there is a repo at', this.bKitPath)
      try {
        const isrepo = await this.git.checkIsRepo()
        if (isrepo) {
          const top = path.normalize(await this.git.revparse(['--show-toplevel']))
          return top === this.bKitPath
        } else return false
      } catch (err) {
        console.warn('checkRepo:', err)
        return false
      }
    },
    clone (dst = this.bKitPath) {
      console.log('Clone to', dst)
      this.cloning = true
      return this.git.clone('https://github.com/jvverde/bKit.git', dst, ['--depth', 1])
        .then((...args) => {
          console.log(...args)
        })
        .catch(err => {
          console.warn(err)
        })
        .finally(() => {
          this.cloning = false
          this.checkbkitInstalled()
        })
    },
    async initRepo () {
      console.log('initRepo')
      const dst = this.bKitPath
      if (!dst) await this.chosebkitLocation()
      if (!exists(dst)) await this.mkdir(dst)
      if (!isEmpty(dst)) {
        return this.whenNotEmpty()
      } else {
        return this.clone(dst)
      }
    },
    async updateRepo () {
      console.log('updateRepo')
      const isRepo = await this.checkRepo()
      if (isRepo) {
        this.updating = true
        return this.git.pull()
          .finally(() => {
            this.updating = false
            this.checkbkitInstalled()
          })
      } else {
        return Promise.reject(new Error(`${this.path} is not a repository`))
      }
    },
    async resetRepo () {
      const isRepo = await this.checkRepo()
      if (isRepo) {
        return this.git.reset(['--hard'])
          .finally(() => {
            this.checkbkitInstalled()
          })
      } else {
        return Promise.reject(new Error(`${this.path} is not a repository`))
      }
    },
    winSetup () {
      console.log('winSetup')
      return new Promise(async (resolve, reject) => {
        if (isWin && this.bkitinstalled) {
          const onclose = (code) => {
            if (0 | code === 0) this.checkbkitOk() // check again
            if (this.bkitok) resolve(true)
            else reject(new Error('Setup: bKit still not running'))
            this.setuping = false
          }
          const onreaddata = (data) => console.log('data:', data.toString())
          const onreaderror = (data) => console.warn('error:', data.toString())
          winInstall({
            onreaddata,
            onreaderror,
            onclose
          })
          this.setuping = true
        } else if (!isWin) {
          reject(new Error('Setup: This is not a Windows platform'))
        } else {
          reject(new Error('Setup: bKit is not yet installed'))
        }
      })
    },
    async setupRepo () {
      console.log('setupRepo')
      const isRepo = await this.checkRepo()
      if (!isRepo) {
        return this.initRepo()
      } else {
        return this.resetRepo()
      }
    },
    async install () {
      console.log('install')
      this.installing = true
      await this.setupRepo()
      if (isWin) await this.winSetup()
      this.installing = false
    }
  }
}
</script>
