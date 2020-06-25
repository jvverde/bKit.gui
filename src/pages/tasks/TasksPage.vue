<template>
  <q-page padding class="relative column no-wrap">
    <q-btn v-if="!add" icon="add" push outline rounded no-caps color="green"
      label="New Task" class="q-ma-sm" @click="add = true"/>
    <job v-else @cancel="cancel" @finish="refresh"/>
    <jobs ref="jobs" v-if="!add"/>
  </q-page>
</template>

<script>

import jobs from './components/listasks/Tasks'
import job from './components/newtask/NewTaskWizard'

export default {
  name: 'TasksPage',
  data () {
    return {
      add: false
    }
  },
  components: {
    jobs,
    job
  },
  methods: {
    refresh () {
      this.add = false
    },
    cancel () {
      this.add = false
    }
  }
}
</script>
