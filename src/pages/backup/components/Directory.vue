<template>
  <q-expansion-item
    switch-toggle-side
    dense
    dense-toggle
    v-model="open"
    :header-style="isSelected ? 'background-color:var(--q-color-selected)' : ''"
    expand-icon="keyboard_arrow_down"
    expand-icon-class="expandicon">
    <template v-slot:header> <!-- this is the header line template -->
      <q-item-section side @click.stop="see">
        <q-icon :name="open ? 'folder_open' : 'folder'" color="folder"/>
      </q-item-section>

      <q-item-section no-wrap>
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

    </template>

    <div v-if="open" style="margin-left:1em">
      <entries v-bind="nodeProps"/>
    </div>
  </q-expansion-item>
</template>

<script>
import entryminxin from 'src/mixins/entry'
export default {
  name: 'directory',
  data () {
    return {
      open: false
    }
  },
  mixins: [entryminxin],
  components: {
    entries: () => import('./Entries')
  },
  computed: {
    nodeProps () {
      const { fullpath, snap, rvid, mountpoint } = this.entry
      return { fullpath, snap, rvid, mountpoint }
    },
    isSelected () {
      return false
    }
  },
  watch: {
  },
  methods: {
    debug (entry) {
      console.log(entry)
    },
    see () {
      this.open = true
    }
  },
  mounted () {
    // console.log('mounted entry', this.entry)
  }
}
</script>

<style lang="scss">
  @import 'src/css/app.scss';
  .isSelected {
    color:$bkit;
    .wasDeleted {
      color: $bkit;
    }
  }
  .wasDeleted {
    color: $deleted;
  }
  .noBackup {
    color: $nobackup;
    color: var(--q-color-nobackup);
  }
  .expandicon, .noexpandicon {
    margin: 0px;
    padding: 0px;
    padding-right: 5px;
    color: $openclose;
  }
  .noexpandicon {
    visibility: hidden;
  }

</style>
