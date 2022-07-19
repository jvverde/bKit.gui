<template>
  <div v-show="clientsList.length > 1">
    <q-select filled v-model="selectedClient" :options="clientsList" option-label="fullUserName" option-value="id" label="Selected Client" stack-label/>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
export default {
  name: 'Clients',
  data () {
    return {
      selectedClient: null
    }
  },
  computed: {
    ...mapGetters('clients', { currentClient: 'getCurrentClient', clientsList: 'getClients' }),
    ...mapGetters('options', ['getOption']),
    showForeignDisks () { return this.getOption('showForeignDisks') }
  },
  watch: {
    selectedClient (client) {
      console.log('selectedClient', client)
      this.selectClient(client)
    }
  },
  components: {
  },
  methods: {
    ...mapMutations('clients', ['selectClient'])
  },
  async mounted () {
  }
}
</script>

<style scoped lang="scss">
</style>
