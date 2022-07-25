<template>
  <div v-if="show">
    <!-- q-select
      v-model="selectedClient"
      :options="clientsList"
      option-label="fullUserName"
      option-value="id"
      label="Filter by Client"
      clearable
      dense
      options-dense
      borderless
      style="min-width: 300px">
      <template v-slot:prepend>
        <q-toggle
          v-model="showForeignDisks"
          checked-icon="check"
          color="warning"
          class="text-body2"
          :label="clientsList.length > 1 ? '': 'All disks'"
          unchecked-icon="clear"
        />
      </template>
    </q-select-->
  </div>
</template>

<script>
const validInRoutes = ['backup']
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
    showForeignDisks: {
      get () { return this.getOption('showForeignDisks') },
      set (val) { this.setOptions({ showForeignDisks: val }) }
    },
    currentRouteName () {
      return this.$route.name
    },
    show () { return validInRoutes.includes(this.currentRouteName) }
  },
  watch: {
    selectedClient (client) {
      console.log('selectedClient', client)
      this.selectClient(client)
    },
    currentRoute (route) {
      console.log('currentRoute is ', route)
    },
    showForeignDisks () {
      this.selectedClient = null
    }
  },
  components: {
  },
  methods: {
    ...mapMutations('clients', ['selectClient']),
    ...mapMutations('options', ['setOptions'])
  },
  async mounted () {
  }
}
</script>

<style scoped lang="scss">
</style>
