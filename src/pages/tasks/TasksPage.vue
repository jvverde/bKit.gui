<template>
  <q-page padding class="relative column no-wrap">
    <jobs ref="jobs" v-if="!add"/>
    <q-btn v-if="!add" icon="add" push outline rounded no-caps color="green"
      label="New Task" class="q-ma-sm" @click="add = true"/>
    <job v-else @cancel="cancel" @finish="refresh"/>
  </q-page>
</template>

<script>

import jobs from './components/Schtasks'
import job from './components/NewTask'

export default {
  name: 'TasksPage',
  data () {
    return {
      add: false
    }
  },
  computed: {
  },
  components: {
    jobs,
    job
  },
  watch: {
  },
  methods: {
    refresh () {
      this.$refs.jobs.load()
      this.add = true
    },
    cancel () {
      this.add = false
    }
  },
  mounted () {
  }
}
</script>
