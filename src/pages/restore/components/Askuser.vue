<template>
  <q-btn icon="restore" color="primary" size="sm" flat round @click.stop="ask" class="b-icon">
    <q-dialog v-model="askuser" persistent >
      <q-card style="min-width:75vw;min-height:75vh" class="column">
        <q-card-section class="row items-center q-pb-none">
          <q-icon name="cloud_download" color="primary" size="md"/>
          <q-space/>
          <div>Recover {{path}} <span v-if="dst">to {{dst}}</span></div>
          <q-space/>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section style="flex-grow: 1" class="column">
          <q-stepper
            style="flex-grow: 1"
            class="column"
            v-model="step"
            ref="stepper"
            color="primary"
            flat
            header-nav
            animated>
            <q-step
              :name="1"
              title="Restore"
              caption="or Recovery"
              icon="settings"
              :done="step > 1">
              <q-card flat>
                <q-card-section v-if="type" align="center">
                  You are about to {{type}} <i>{{path}}</i> from backup of <b>{{backupdate}}</b> ({{timeago}})
                </q-card-section>
                <q-card-section v-else align="center">
                  How do you want to proceed?
                </q-card-section>
                <q-card-actions class="column" align="center">
                  <q-radio v-model="type" val="recover" label="Recover to another location" color="cyan"/>
                  <q-radio v-model="type" val="restore" label="Restore to original location" color="orange" :disable="!disk.present"/>
                </q-card-actions>
              </q-card>
            </q-step>

            <q-step
              :name="2"
              title="Destination"
              caption="Folder"
              icon="folder"
              :done="step > 2"
              :disable="type !== 'recover'">
              <q-card flat>
                <q-card-section class="row items-center justify-around">
                  <span v-if="dst" class="q-ml-sm">
                    Recover to {{dst}}
                  </span>
                  <span v-else class="q-ml-sm">
                    Choose a destination directory where you want to recover '{{path}}'
                  </span>
                </q-card-section>

                <q-card-actions align="center">
                  <q-btn v-if="dst === null" label="Select"
                    color="primary" @click="setdst"/>
                  <q-btn v-else label="Change" outline
                    color="primary" @click="setdst"/>
                </q-card-actions>
              </q-card>
            </q-step>

            <q-step
              :name="3"
              :done="step > 3"
              title="Options"
              icon="assignment">
              <q-card flat>
                <q-card-section class="column items-start">
                  <q-checkbox
                    v-model="rsyncoptions"
                    val="--delete"
                    label="Delete local files not present in backup"
                    color="teal" />
                  <q-checkbox
                    v-model="rsyncoptions"
                    val="--dry-run"
                    label="Dry run"
                    color="teal" />
                </q-card-section>
                <q-card-section class="columns items-start" v-if="type === 'recover' && disk.present">
                  <div>For unchanged files</div>
                  <q-option-group
                    :options="localoptions"
                    type="radio"
                    v-model="local"/>
                </q-card-section>
              </q-card>
            </q-step>

            <q-step
              :name="4"
              title="Finish"
              icon="check">
              <span class="absolute-center">I am ready to start {{type}}</span>
            </q-step>

            <template v-slot:navigation>
              <q-stepper-navigation class="row justify-end" style="margin-top: auto">
                <q-btn v-if="step > 1" outline color="primary" @click="$refs.stepper.previous()" label="Back" class="q-mr-sm"/>
                <q-btn v-if="step === 4" color="primary" :label="type"
                  @click="doit"/>
                <q-btn v-else color="primary" label="Continue"
                  :disable="disablenext"
                  @click="$refs.stepper.next()"/>
              </q-stepper-navigation>
            </template>
          </q-stepper>
        </q-card-section>
        <q-card-actions align="left" style="margin-top:auto">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-btn>
 </template>

<script>
const path = require('path')
const { dialog, app } = require('electron').remote
const moment = require('moment')
moment.locale('en')
export default {
  data () {
    return {
      step: 1,
      usertypechoice: null,
      recoverydir: false,
      dst: null,
      local: '--local-copy',
      localoptions: [
        { label: 'Copy from local', value: '--local-copy', color: 'red' },
        { label: 'Link to local', value: '--local-link', color: 'green' }
      ],
      rsyncoptions: [],
      askuser: false
    }
  },
  computed: {
    path () {
      return this.disk.present
        ? path.normalize(`${this.disk.mountpoint}/${this.entry.path}`)
        : path.normalize(`/${this.entry.path}`)
    },
    disablenext () {
      if (this.step === 1) return this.type === null // on the first step only allow next after choosing
      else return this.type === 'recover' && this.dst === null
    },
    type: {
      get: function () {
        return this.disk.present ? this.usertypechoice : 'recover'
      },
      set: function (val) {
        this.usertypechoice = val
      }
    },
    datetime () {
      return moment.utc(this.snap.substring(5), 'YYYY.MM.DD-HH.mm.ss').local()
    },
    backupdate () {
      return this.datetime.format('ddd lll')
    },
    timeago () {
      return this.datetime.fromNow()
    }
  },
  props: {
    disk: {
      type: Object,
      required: true
    },
    snap: {
      type: String,
      required: true
    },
    entry: {
      type: Object,
      required: true
    }
  },
  methods: {
    ask () {
      console.log('DIR:', this.entry)
      console.log('DSK:', this.disk)
      this.askuser = true
    },
    doit () {
      let options = [
        this.local
      ]
      if (this.dst !== null) options.push(`--dst=${this.dst}`)
      // unix path to avoid problems in rbkit.sh with backslash
      const upath = path.posix.join('/', ...this.path.split(path.sep))
      this.$emit('restore', {
        disk: this.disk,
        snap: this.snap,
        path: upath,
        options: options,
        rsyncoptions: this.rsyncoptions
      })
      this.askuser = false
    },
    setdst () {
      this.dst = this.dst || app.getPath('downloads') || app.getPath('temp')
      dialog.showOpenDialog({
        title: 'Where you want to recover your data',
        defaultPath: this.dst,
        buttonLabel: 'Recover to here',
        properties: ['openDirectory', 'promptToCreate']
      }).then((result) => {
        if (result.filePaths instanceof Array) {
          this.dst = result.filePaths[0]
        }
      }).catch((err) => {
        this.dst = null
        console.error('Get path', err)
      })
    }
  }
}
</script>
