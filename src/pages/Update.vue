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
          <q-item-label>{{bKitPath}}</q-item-label>
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
          <q-btn :disable="installing" color="ok" flat label="Reset" no-caps @click="reset"/>
          <q-btn :disable="installing" :loading="updating" color="ok" flat label="Update" no-caps @click="update"/>
        </q-item-section>
        <q-item-section side v-else>
          <q-btn :disable="installing" :loading="cloning" color="ok" flat label="Install" no-caps @click="initRepo"/>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section side>
          <q-item-label>Bkit Client is running ok:</q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{bkitok}}</q-item-label>
        </q-item-section>
        <q-item-section side v-if="isWin">
          <q-btn :disable="installing" color="ok" flat label="Setup" no-caps @click="setup"/>
        </q-item-section>
      </q-item>
    </q-list>
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

const chosebkitLocation = (path) => {
  return dialog.showOpenDialog({
    title: 'Select a new location for bKit client',
    defaultPath: path,
    buttonLabel: 'Choose',
    properties: ['openDirectory', 'promptToCreate']
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
      goahead: () => false,
      step: 1,
      isWin,
      cloning: false,
      updating: false
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
    installing () { return this.cloning || this.updating },
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
      handler (val) {
        console.log('needAttention', val)
        const { bkitlocation, bkitinstalled, bkitok } = this
        if (!bkitlocation) {
          const defaultPath = path.normalize(path.join(app.getAppPath(), '../bKit-client'))
          mkdir(defaultPath)
          this.chosebkitLocation(defaultPath)
        } else if (!exists(bkitlocation)) {
          mkdir(bkitlocation)
          this.initRepo()
        } else if (!bkitinstalled) {
          this.initRepo()
        } else if (!bkitok) {
          this.setup()
        }
      }
    }
  },
  methods: {
    ...mapMutations('global', ['setbkitLocation', 'checkbkitInstalled', 'checkbkitOk']),
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
    clone () {
      const dst = this.bKitPath
      if (!exists(dst)) mkdir(dst)
      if (!isEmpty(dst)) {
        this.whenNotEmpty()
      } else {
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
      }
    },
    async update () {
      console.log('update')
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
    async reset () {
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
    setup () {
      return new Promise((resolve, reject) => {
        if (isWin) {
          const onclose = (code) => {
            if (0 | code === 0) this.checkbkitOk() // check again
            if (this.bkitok) resolve(true)
            else reject(new Error('Bkit is not running'))
          }
          const onreaddata = (data) => console.log('data:', data.toString())
          const onreaderror = (data) => console.warn('error:', data.toString())
          install({
            onreaddata,
            onreaderror,
            onclose
          })
        } else {
          reject(new Error('This is not a Windows platform, as so the cygwin is not used'))
        }
      })
    },
    whenNotEmpty () {
      this.askuser = true
      this.statement = `Directory '${this.bKitPath}' is not empty`
      this.message = 'Please select a empty dir'
      this.goahead = () => {
        this.askuser = false
        this.chosebkitLocation()
      }
    },
    checkRepo () {
      console.log('Check if is repo at', this.bKitPath)
      return this.git.checkIsRepo()
        .catch(err => {
          console.warn('checkRepo:', err)
          return false
        })
    },
    async initRepo () {
      console.log('initRepo')
      const isRepo = await this.checkRepo()
      if (!isRepo) {
        return this.clone()
      } else if (!this.bkitinstalled) {
        return this.reset()
      } else if (isWin && !this.bkitok) {
        return this.setup()
      } else return false
    }
  }
}
</script>
