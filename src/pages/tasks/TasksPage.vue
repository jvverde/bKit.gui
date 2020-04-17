<template>
  <q-page padding class="relative column no-wrap">
    <jobs/>
    <q-btn icon="add" push outline rounded no-caps color="green"
      label="New Task" class="q-ma-sm" @click="add = true" v-if="!add"/>
    <job v-if="add" @cancel="add = false"/>
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
  },
  mounted () {
  }
}
</script>
