<template>
  <q-list dense>
    <q-item dense class="file">
      <q-item-section side>
        <q-item-label>
          <q-icon name="description" color="file"/>
        </q-item-label>
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
import entry from 'src/mixins/entry'
export default {
  name: 'FileEntry',
  data () {
    return {
    }
  },
  mixins: [entry],
  computed: {
  },
  methods: {
    debug () {
      console.log('mounted entry', this.entry)
    }
  }
}
</script>

<style lang="scss">
  .file {
    padding-right: 0 !important;
  }
</style>
