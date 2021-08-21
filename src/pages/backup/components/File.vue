<template>
  <q-list dense>
    <q-item> <!-- this is the header line template -->
      <q-item-section side>
        <q-icon name="description" color="file"/>
      </q-item-section>

      <q-item-section no-wrap>
        <q-item-label class="ellipsis">
          <span :class="{ wasDeleted: wasdeleted, noBackup: isnew }">
            {{name}}
          </span>
          <q-icon name="done" color="updated" v-if="isUpdate"/>
          <q-icon name="call_merge" color="modified" v-else-if="wasmodified"/>
          <q-icon name="arrow_upward" color="nobackup" v-else-if="isnew"/>
          <q-icon name="arrow_downward" color="deleted" v-else-if="wasdeleted"/>
          <q-icon name="block " color="filtered" v-else-if="isfiltered"/>
        </q-item-label>
      </q-item-section>

      <q-item-section side no-wrap>
         <q-btn-group flat rounded>
          <q-btn round color="button" flat size="sm" icon="restore"/>
        </q-btn-group>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script>
export default {
  name: 'file',
  data () {
    return {
      open: false
    }
  },
  components: {
  },
  props: {
    entry: {
      type: Object,
      required: true
    }
  },
  computed: {
    isSelected () {
      return this.path === this.displayNode
    },
    selectedNode: {
      get () {
        return this.displayNode
      },
      set (val) {
        this.$emit('update:displayNode', val)
      }
    },
    isloading () {
      return this.loading
    },
    isdir () {
      return this.entry.isdir
    },
    isroot () {
      return this.entry.isroot
    },
    path () {
      return this.entry.path
    },
    name () {
      return this.entry.name
    },
    leaf () {
      return !this.isdir
    },
    isOpen () {
      return this.open && this.isdir
    },
    onbackup () { // We should be very carefully with this one
      return !!this.entry.onbackup // && !!this.entry.markAsUnverified
    },
    onlocal () {
      return !!this.entry.onlocal
    },
    wasdeleted () { return this.onbackup && !this.onlocal },
    isfiltered () { return !!this.entry.isfiltered },
    isnew () { return !this.onbackup && this.onlocal && !!this.entry.isnew },
    wasmodified () { return this.onbackup && this.onlocal && !!this.entry.wasmodified },
    isUpdate () { return this.onbackup && this.onlocal && !this.isnew && !this.wasmodified }
  },
  watch: {
  },
  methods: {
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
