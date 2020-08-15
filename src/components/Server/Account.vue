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
import { getPassword } from 'src/helpers/credentials'
import { initServer } from 'src/helpers/bkit'
import { catched } from 'src/helpers/notify'

export default {
  name: 'Account',
  data () {
    return {
      loading: false
      // initialized: false,
      // credentials: false
    }
  },
  props: ['server', 'user'],
  computed: {
    ...mapGetters('global', ['getAccount']),
    initialized: {
      get () { return this.account.initialized === true },
      set (val) {
        if (val) {
          console.log('Init', this.user, this.server)
          this.init()
        } else {
          console.log('Delete profile for', this.user, this.server)
          this.clear()
        }
      }
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
    ...mapActions('global', ['delCredentials', 'loadServers']),
    cancel () {
      this.$router.back()
    },
    async init () {
      console.log('init')
      try {
        if (this.credentials) {
          const pass = await getPassword(`${this.user}@${this.server}`)
          this.loading = false
          await initServer(this.account, pass)
          this.loadServers()
        }
      } catch (err) {
        catched(err)
      } finally {
        this.loading = false
      }
    },
    clear () {
      console.log('clear')
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
