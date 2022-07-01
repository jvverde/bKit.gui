<template>
  <q-list dense>
    <q-item dense class="directory line" :style="isSelected ? 'background-color:var(--q-color-selected)' : ''">
      <!--q-expansion-item
        switch-toggle-side
        dense
        dense-toggle
        v-model="open"
        :header-style="isSelected ? 'background-color:var(--q-color-selected)' : ''"
        expand-icon="keyboard_arrow_down"
        expand-icon-class="expandicon"-->
      <q-item-section side @click.stop="open = !open" class="cursor-pointer" no-wrap>
        <q-item-label>
          <q-icon :name="open ? 'expand_more' : 'chevron_right'"/>
          <q-icon :name="open ? 'folder_open' : 'folder'" color="folder"/>
        </q-item-label>
      </q-item-section>

      <q-item-section no-wrap  @click.stop="select" class="cursor-pointer" >
        <q-item-label class="ellipsis">
          <span :style="`color:var(--q-color-${getcolor})`">
            {{name}}
          </span>
          <q-icon name="done" color="updated" v-if="isUpdate"/>
          <q-icon name="call_merge" color="modified" v-else-if="needUpdate"/>
          <q-icon name="arrow_upward" color="nobackup" v-else-if="onlyLocal"/>
          <q-icon name="arrow_downward" color="deleted" v-else-if="onlyBackup"/>
          <!-- q-icon name="block " color="filtered" v-else-if="isfiltered"/ -->
        </q-item-label>
      </q-item-section>

      <q-item-section side no-wrap>
         <q-btn-group flat rounded>
          <q-btn round color="button" flat size="sm" icon="restore"/>
        </q-btn-group>
      </q-item-section>

    </q-item>
    <q-item dense v-if="open" class="directory">
      <entries v-bind="nodeProps"/>
    </q-item>
  </q-list>
</template>

<script>
import entry from 'src/mixins/entry'
import { mapGetters, mapMutations } from 'vuex'

export default {
  name: 'DirEntry',
  data () {
    return {
      open: false
    }
  },
  mixins: [entry],
  components: {
    entries: () => import('./Listdir') /* Listdir.vue also dynamically import this moddule */
  },
  computed: {
    nodeProps () {
      const { fullpath, snap, rvid, mountpoint } = this.entry
      return { fullpath, snap, rvid, mountpoint }
    },
    isSelected () {
      return this.getview === this.fullpath
    },
    ...mapGetters('view', ['getview'])
  },
  watch: {
    getview: {
      immediate: true,
      handler (val, old) {
        if (val && this.path && val.length > this.path.length && val.startsWith(this.path)) {
          this.open = true
        }
      }
    }
  },
  methods: {
    ...mapMutations('view', ['setView']),
    debug (entry) {
      console.log(entry)
    },
    see () {
      this.open = true
    },
    select () {
      this.setView(this.fullpath)
    }
  },
  mounted () {
    // console.log('mounted entry', this.entry)
  }
}
</script>

<style lang="scss">
  @import 'src/css/app.scss';
  .directory {
    padding-right: 0 !important;
  }
  .directory.line:hover {
    background-color: $grey-2;
  }
  .isSelected {
    color:$bkit;
    .wasDeleted {
      color: $bkit;
    }
  }
</style>
