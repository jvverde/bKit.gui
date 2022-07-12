<template>
  <div v-show="showProgress" class="fixed-full fullscreen row justify-center items-center content-center capa">
    <vue-draggable-resizable :w="400" :h="300">
      <q-card class="bg-secondary text-white">
        <q-bar>
          <q-space />

          <!-- q-btn dense flat icon="minimize" @click="maximizedToggle = false" :disable="!maximizedToggle">
            <q-tooltip v-if="maximizedToggle" content-class="bg-white text-primary">Minimize</q-tooltip>
          </q-btn>
          <q-btn dense flat icon="crop_square" @click="maximizedToggle = true" :disable="maximizedToggle">
            <q-tooltip v-if="!maximizedToggle" content-class="bg-white text-primary">Maximize</q-tooltip>
          </q-btn -->
          <q-btn dense flat icon="close" @click="hide()">
            <q-tooltip content-class="bg-white text-primary">Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="q-pt-xs q-pb-xs">
          <div class="text-h6">Backups in progress</div>
        </q-card-section>

        <q-card-section class="list q-pt-none q-ma-xs overflow-auto bg-grey-10 text-white">
          <q-list dark separator>
            <backup
              v-for="(path, index) in paths2Backup"
              :key="path + index"
              :path="path"
            />
          </q-list>
        </q-card-section>
      </q-card>
    </vue-draggable-resizable>
  </div>
</template>

<script>

import backup from './Backup'
import { mapGetters, mapMutations } from 'vuex'
import { getPreferences, setPreferences } from 'src/helpers/preferences'

export default {
  name: 'backupProgress',
  data () {
    return {
      maximizedToggle: true
    }
  },
  components: {
    backup
  },
  computed: {
    ...mapGetters('backups', { paths2Backup: 'getList', showProgress: 'show', empty: 'empty' })
  },
  watch: {
    paths2Backup: {
      immediate: true,
      handler (list, old) {
        if (!this.empty) this.show()
        this.savePrefs()
      }
    }
  },
  methods: {
    ...mapMutations('backups', ['show', 'hide', 'add2backup']),
    savePrefs () {
      const prefs = getPreferences() || {}
      const backupList = this.paths2Backup
      setPreferences({ ...prefs, backupList })
    }
  },
  mounted () {
    const { backupList = [] } = getPreferences() || {}
    backupList.forEach(path => {
      this.add2backup(path)
    })
    this.hide()
  }
}
</script>

<style scoped lang="scss">
  .capa {
    background-color: rgba(128, 128, 128, 0.5);
  }
  .list {
    max-height: 80vh;
    max-width: 99vw;
  }
</style>
