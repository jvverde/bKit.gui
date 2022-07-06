<template>
  <q-dialog
      v-model="show"
      persistent
      :maximized="maximizedToggle"
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="bg-primary text-white">
        <q-bar>
          <q-space />

          <q-btn dense flat icon="minimize" @click="maximizedToggle = false" :disable="!maximizedToggle">
            <q-tooltip v-if="maximizedToggle" content-class="bg-white text-primary">Minimize</q-tooltip>
          </q-btn>
          <q-btn dense flat icon="crop_square" @click="maximizedToggle = true" :disable="maximizedToggle">
            <q-tooltip v-if="!maximizedToggle" content-class="bg-white text-primary">Maximize</q-tooltip>
          </q-btn>
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip content-class="bg-white text-primary">Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section>
          <div class="text-h6">backups in progress</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <backup
            v-for="(path, index) in paths2Backup"
            :key="'P-' + index + path"
            :path="path"
            @destroy="destroy_backup(index)"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
</template>

<script>

import backup from 'src/components/backup/Backup'
import { mapGetters } from 'vuex'

export default {
  name: 'backupProgress',
  data () {
    return {
      show: false,
      maximizedToggle: true
    }
  },
  components: {
    backup
  },
  computed: {
    ...mapGetters('backup', { paths2Backup: 'getList' })
  },
  watch: {
    paths2Backup: {
      immediate: true,
      async handler (list, old) {
        this.show = this.paths2Backup.length > 0
      }
    }
  },
  methods: {
  }
}
</script>

<style scoped lang="scss">
  .bpro {
    top: 0;
  }
</style>
