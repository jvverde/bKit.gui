<template>
  <q-card>
    <q-card-section horizontal>
      <q-card-section class="column no-wrap items-center">
        <!--div>
          [{{status}}]
        </div-->
        <q-icon
          v-if="isdir"
          class="bkit-icon"
          name="folder"
          :color="colorosOf[status]"/>
        <q-icon
          v-else-if="isfile"
          class="bkit-icon"
          name="description"
          :color="colorosOf[status]"/>
        <q-icon
          v-else-if="wasdeleted"
          class="bkit-icon"
          name="delete_sweep"
          color="red-7"/>
        <div class="bkit-text">
          {{name}}
          <span v-if="wasdeleted && hasdescendants">
            [+{{descendants}}]
          </span>
        </div>
      </q-card-section>
      <q-card-actions vertical class="justify-around q-px-xs">
        <q-btn flat color="primary" icon="restore" no-caps stack label="Restore" v-if="wasdeleted"/>
        <q-btn flat color="primary" icon="backup" no-caps stack label="Backup" v-if="isnew"/>
        <q-btn flat color="teal" icon="backup" no-caps stack label="Backup" v-if="ismodified"/>
        <q-btn flat color="amber" icon="assignment"  no-caps stack label="Versions" v-if="hasbackup"/>
        <!--q-btn flat round color="cyan" icon="share" /-->
      </q-card-actions>
    </q-card-section>
  </q-card>
</template>
<script>

export default {
  name: 'item',
  data () {
    return {
      colorosOf: {
        deleted: 'red',
        onbackup: 'cyan',
        new: 'green',
        modified: 'blue',
        local: 'black'
      }
    }
  },
  computed: {
    isdir () { return this.entry.isdir },
    isfile () { return this.entry.isfile },
    status () { return this.entry.status },
    hasbackup () { return this.status !== 'new' && this.status !== 'local' },
    name () { return this.entry.name },
    path () { return this.entry.path },
    descendants () { return this.entry.descendants },
    hasdescendants () { return 0 | this.descendants > 0 },
    wasdeleted () { return this.status === 'deleted' },
    ismodified () { return this.status === 'modified' },
    isnew () { return this.status === 'new' }
  },
  props: {
    entry: {
      type: Object,
      require: true
    }
  },
  methods: {
  },
  mounted () {
    // console.log('entry:', this.entry)
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
