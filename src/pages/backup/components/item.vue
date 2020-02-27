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
        v-else-if="entry.type === 'deleted'"
        class="bkit-icon"
        name="delete_sweep"
        color="red-7"/>
      <div class="bkit-text">
        {{entry.name}}
        <span v-if="type === 'deleted' && descendants > 0">
          [+{{descendants}}]
        </span>
      </div>
    </div>
    <q-card-actions align="right" style="margin-top:auto">
      <q-btn flat round color="primary" icon="restore" v-if="type === 'deleted'"/>
      <q-btn flat round color="teal" icon="bookmark" v-if="type === 'new'"/>
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
    name () { return this.entry.name },
    path () { return this.entry.path },
    descendants () { return this.entry.descendants }
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
