<template>
  <q-page padding class="relative column no-wrap">
    <jobs ref="jobs"/>
    <q-btn icon="add" push outline rounded no-caps color="green"
      label="New Task" class="q-ma-sm" @click="add = true" v-if="!add"/>
    <job v-if="add" @cancel="add = false" @finish="refresh"/>
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
    }
  },
  mounted () {
  }
}
</script>
