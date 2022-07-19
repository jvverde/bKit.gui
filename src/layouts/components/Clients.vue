<template>
  <div v-show="uniqueNames.length > 1">
    <q-select filled v-model="selectedClient" :options="uniqueNames" label="Client" stack-label/>
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
    clients () {
      return this.clientsList.map(d => {
        const localUserName = `${d.computer.user}@${d.computer.name}.${d.computer.domain}`
        const extendedName = `${localUserName} (${d.computer.uuid})`
        return { ...d, localUserName, extendedName }
      })
      // return [...new Set(names)].sort()
      // return names.sort()
    },
    clientsNames () {
      return this.clients.map(c => c.extendedName)
    },
    uniqueNames () {
      return [...new Set(this.clientsNames)].sort()
    }
  },
  watch: {
    selectedClient (val) {
      console.log('Selected', this.clients.filter(c => c.localUserName === val))
    }
  },
  components: {
  },
  methods: {
    ...mapMutations('clients', ['setCurrentClient'])
  },
  async mounted () {
  }
}
</script>

<style scoped lang="scss">
</style>
