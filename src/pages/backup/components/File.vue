<template>
  <q-list dense>
    <q-item> <!-- this is the header line template -->
      <q-item-section side>
        <q-icon name="description" color="file"/>
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
          <q-btn round color="button" flat size="sm" icon="help" @click="debug"/>
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
    getcolor () {
      if (this.isUpdate) return 'updated'
      else if (this.needUpdate) return 'modified'
      else if (this.onlyLocal) return 'nobackup'
      else if (this.onlyBackup) return 'deleted'
      return undefined
    },
    path () {
      return this.entry.path
    },
    name () {
      return this.entry.name
    },
    isOpen () {
      return this.open && this.isdir
    },
    onbackup () {
      return !!this.entry.onbackup
    },
    onlocal () {
      return !!this.entry.onlocal
    },
    onlyBackup () { return this.entry.onlyBackup === true },
    // isfiltered () { return !!this.entry.isfiltered },
    onlyLocal () { return this.entry.onlyLocal === true },
    isUpdate () { return this.entry.updated === true },
    needUpdate () { return this.entry.needUpdate === true }
  },
  watch: {
  },
  methods: {
    debug () {
      console.log('mounted entry', this.entry)
    }
  },
  mounted () {
  }
}
</script>

<style lang="scss">
  @import 'src/css/app.scss';
  .noBackup {
    color: $nobackup;
    color: var(--q-color-nobackup);
  }
</style>
