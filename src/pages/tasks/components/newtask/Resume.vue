<template>
  <div style="margin-top: auto; margin-bottom: auto ">
    <q-bar dense v-if="hasBackups">Backup</q-bar>
    <q-chip dense color="included" outline :label="b"
      size="sm"
      v-for="(b, i) in backups" :key="'b' + i"/>
    <q-bar dense v-if="hasExcludes">Excluding</q-bar>
    <q-chip dense color="excluded" outline :label="e.path"
      size="sm"
      v-for="e in excludes" :key="'e' + e.path"/>
    <q-bar dense v-if="hasNeeds2include">Including</q-bar>
    <q-chip dense color="included" outline :label="n.path"
      size="sm"
      v-for="n in needs2include" :key="'n' + n.path"/>
  </div>
</template>

<script>

export default {
  name: 'resume',
  props: {
    backups: {
      type: Array,
      require: true
    },
    includes: {
      type: Array,
      default: () => []
    },
    excludes: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    hasBackups () {
      return this.backups.length > 0
    },
    hasExcludes () {
      return this.excludes.length > 0
    },
    needs2include () { // Needs2include = Includes - Backups
      return this.includes.filter(e => !this.backups.includes(e.path))
    },
    hasNeeds2include () {
      return this.needs2include.length > 0
    }
  }
}
</script>
<style type="text/scss">
</style>
