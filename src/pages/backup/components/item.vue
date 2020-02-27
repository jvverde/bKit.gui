<template>
  <q-card class="column">
    <div class="column no-wrap items-center">
      <q-icon
        v-if="isdir"
        class="bkit-icon"
        name="folder"
        :color="colorosOf[type]"/>
      <q-icon
        v-else-if="isfile"
        class="bkit-icon"
        name="description"
        :color="colorosOf[type]"/>
      <q-icon
        v-else-if="wasdeleted"
        class="bkit-icon"
        name="delete_sweep"
        color="red-7"/>
      <div class="bkit-text">
        {{entry.name}}
        <span v-if="wasdeleted && hasdescendants">
          [+{{descendants}}]
        </span>
      </div>
    </div>
    <q-card-actions align="right" style="margin-top:auto">
      <q-btn flat round color="primary" icon="restore" v-if="wasdeleted"/>
      <q-btn flat round color="teal" icon="backup" v-if="isnew"/>
      <q-btn flat round color="teal" icon="assignment" v-if="ismodified"/>
      <q-btn flat round color="teal" icon="assignment" v-if="hastype"/>
      <q-btn flat round color="cyan" icon="share" />
    </q-card-actions>
  </q-card>
</template>
<script>

export default {
  name: 'item',
  data () {
    return {
      colorosOf: {
        deleted: 'red',
        updated: 'cyan',
        new: 'green',
        modified: 'blue'
      }
    }
  },
  computed: {
    isdir () { return this.entry.isdir },
    isfile () { return this.entry.isfile },
    type () { return this.entry.type },
    hastype () { return 'type' in this.entry },
    name () { return this.entry.name },
    path () { return this.entry.path },
    descendants () { return this.entry.descendants },
    hasdescendants () { return 0 | this.descendants > 0 },
    wasdeleted () { return this.type === 'deleted' },
    ismodified () { return this.type === 'updated' },
    isnew () { return this.type === 'new' }
  },
  props: {
    entry: {
      type: Object,
      require: true
    }
  },
  methods: {
  }
}
</script>

<style scoped lang="scss">
  $bkitsize: 6em;
  .bkit-text{
    max-width:$bkitsize;
    overflow-wrap: break-word;
    text-align:center
  }
  .bkit-icon{
    font-size:$bkitsize;
  }
</style>
