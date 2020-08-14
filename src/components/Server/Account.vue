<template>
  <div class="fit relative-position">
    <div class="absolute-center">
      <q-list flat class="q-mt-xl">
        <q-item>
          <q-item-section>
            Manage account
          </q-item-section>
          <q-item-section side>
            {{user}}@{{server}}
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            Backup Port
          </q-item-section>
          <q-item-section side>
            {{account.bport}}
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            Backup area ID
          </q-item-section>
          <q-item-section side>
            {{account.section}}
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            Initialized
          </q-item-section>
          <q-item-section side>
            <q-toggle
              v-model="initialized"
              icon-color="red"
              checked-icon="check"
              color="done"
              unchecked-icon="clear"
            />
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            Credentials
          </q-item-section>
          <q-item-section side>
            <q-toggle
              v-model="credentials"
              icon-color="red"
              checked-icon="check"
              color="done"
              unchecked-icon="clear"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
    <q-btn class="absolute-top-right" flat round icon="cancel" @click="cancel" color="red" size="sm" />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
export default {
  name: 'Account',
  data () {
    return {
      // initialized: false,
      // credentials: false
    }
  },
  props: ['server', 'user'],
  computed: {
    ...mapGetters('global', ['getAccount']),
    initialized: {
      get () { return this.account.initialized === true },
      set (val) { console.log('set init to', val) }
    },
    credentials: {
      get () { return this.account.credentials === true },
      set (val) {
        if (val) {
          console.log('set credentials to', val)
          this.setcred()
        } else {
          console.log('clear credentials to', val)
          this.clearcred()
        }
      }
    },
    account () { return this.getAccount(this.server, this.user) }
    // initialized () { return this.account.initialized === true },
    // credentials () { return this.account.credentials === true },
  },
  watch: {
  },
  methods: {
    ...mapActions('global', ['delCredentials']),
    cancel () {
      this.$router.back()
    },
    setcred () {
      const params = { server: this.server, user: this.user }
      this.$router.push({ name: 'login', params })
    },
    clearcred () {
      const { user, server: address } = this
      this.delCredentials({ user, address })
    }
  }
}
</script>
