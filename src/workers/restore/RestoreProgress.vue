<template>
  <div v-show="showProgress" class="fixed-full fullscreen row justify-center items-center content-center capa">
    <vue-draggable-resizable :w="600" :h="'auto'">
      <q-card class="bg-blue-grey-8 text-white fit column no-wrap">
        <q-bar>
          <q-space />
          <b-btn dense flat icon="close" @click="hide" hint="Close"/>
        </q-bar>

        <q-card-section class="q-pt-xs q-pb-xs">
          <div class="text-h6">Restores in progress</div>
        </q-card-section>

        <q-card-section class="list q-pt-none q-ma-xs overflow-auto bg-grey-10 text-white">
          <q-list dark separato>
            <restore
              v-for="(res, index) in paths2Restore"
              :key="res.path + index"
              :resource="res"
            />
          </q-list>
        </q-card-section>
      </q-card>
    </vue-draggable-resizable>
  </div>
</template>

<script>

import restore from './Restore'
import { mapGetters, mapMutations } from 'vuex'
import { bBtn } from 'src/components/wrapper'

export default {
  name: 'restoreProgress',
  data () {
    return {
      maximizedToggle: true
    }
  },
  components: {
    restore,
    bBtn
  },
  computed: {
    ...mapGetters('restore', { paths2Restore: 'getList', showProgress: 'show' })
  },
  watch: {
    paths2Restore: {
      immediate: true,
      async handler (list, old) {
        this.show = this.paths2Restore.length > 0
      }
    }
  },
  methods: {
    ...mapMutations('restore', ['hide'])
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
