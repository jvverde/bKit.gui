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
          <q-item-section side style="min-width:20em">
            {{account.section}}
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            Logged-in
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
        <q-item>
          <q-item-section>
            Joined
          </q-item-section>
          <q-item-section side>
            <q-toggle
              v-model="initialized"
              icon-color="red"
              checked-icon="check"
              color="done"
              unchecked-icon="clear"
              :disable="!credentials"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
    <q-btn class="absolute-top-right" flat round icon="cancel" @click="cancel" color="red" size="sm" />
    <q-inner-loading :showing="loading">
      <q-spinner-ios size="xl" color="loader"/>
      <span>{{msg}}</span>
    </q-inner-loading>
  </div>
</template>

<script>

import { mapGetters, mapActions } from 'vuex'
import { getPassword } from 'src/helpers/credentials'
import { catched } from 'src/helpers/notify'

export default {
  name: 'Account',
  data () {
    return {
      msg: undefined
      // initialized: false,
      // credentials: false
    }
  },
  props: ['server', 'user'],
  computed: {
    ...mapGetters('global', ['getAccount']),
    loading () { return this.msg && this.msg.length > 0 },
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
    account () { return this.getAccount(this.server, this.user) || {} }
    // initialized () { return this.account.initialized === true },
    // credentials () { return this.account.credentials === true },
  },
  watch: {
  },
  methods: {
    ...mapActions('global', ['delCredentials', 'loadServers', 'deleteProfile', 'initProfile']),
    cancel () {
      this.$router.back()
    },
    async init () {
      console.log('init')
      try {
        this.msg = 'Changing keys with server'
        if (this.credentials) {
          const pass = await getPassword(`${this.user}@${this.server}`)
          await this.initProfile({ account: this.account, pass })
        }
      } catch (err) {
        catched(err)
      } finally {
        this.msg = undefined
      }
    },
    async clear () {
      try {
        this.msg = 'Deleting profile'
        await this.deleteProfile(this.account)
      } catch (err) {
        catched(err)
      } finally {
        this.msg = undefined
      }
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
