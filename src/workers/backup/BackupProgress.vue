<template>
  <div v-show="showProgress" class="fixed-full fullscreen row justify-center items-center content-center capa" @click.self="hide">
    <vue-draggable-resizable :w="600" :h="'auto'"  @resizestop="resizestop">
      <q-card class="bg-blue-grey-8 text-white fit column no-wrap">
        <q-bar>
          <q-space />
          <b-btn dense flat icon="close" @click="hide" hint="Close"/>
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
import { bBtn } from 'src/components/wrapper'
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
    backup,
    bBtn
  },
  computed: {
    ...mapGetters('backups', { paths2Backup: 'getList', showProgress: 'show' })
  },
  watch: {
    paths2Backup (backupList, old) {
      setPreferences({ backupList })
    }
  },
  methods: {
    ...mapMutations('backups', ['hide', 'show', 'add2backup']),
    resizestop () {
      const hide = this.hide
      this.hide = () => {
        this.hide = hide
      }
    }
  },
  async mounted () {
    const { backupList = [] } = (await getPreferences()) || {}
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
