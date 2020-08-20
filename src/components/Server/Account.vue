<template>
  <div class="fit relative-position">
    <div class="absolute-center">
      <q-list flat>
        <q-item>
          <q-item-section>
            <q-radio v-model="isDefault" :val="true" label="Set as default" :disable="!profile" />
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item class="q-mt-xl">
          <q-item-section>
            Manage account
          </q-item-section>
          <q-item-section side>
            {{account.user}}@{{account.servername}}
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
              v-model="autorized"
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
              v-model="profile"
              icon-color="red"
              checked-icon="check"
              color="done"
              unchecked-icon="clear"
              :disable="(!profile && !autorized) || (profile && isDefault)"
            />
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-btn icon="cancel" flat label="Remove Account" @click="remove"  color="red" size="sm" :disable="isDefault"/>
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
      // profile: false,
      // autorized: false
    }
  },
  props: ['server', 'user'],
  computed: {
    ...mapGetters('global', ['getAccount', 'currentAccount']),
    loading () { return this.msg && this.msg.length > 0 },
    profile: {
      get () { return this.account.profile === true },
      set (val) {
        if (val) {
          console.log('Init', this.user, this.server)
          this.init()
        } else {
          console.log('Delete profile for', this.user, this.server)
          this.removeProfile()
        }
      }
    },
    autorized: {
      get () { return this.account.autorized === true },
      set (val) {
        if (val) {
          console.log('set credentials to', val)
          this.setCredentails()
        } else {
          console.log('Unset credentials to', val)
          this.removeCredentials()
        }
      }
    },
    account () { return this.getAccount(this.server, this.user) || {} },
    isDefault: {
      get () {
        return this.currentAccount && this.currentAccount.servername === this.account.servername && this.currentAccount.user === this.account.user
      },
      set (val) {
        if (val) this.setAccountAsDefault()
      }
    }
    // profile () { return this.account.profile === true },
    // credentials () { return this.account.autorized === true },
  },
  watch: {
  },
  methods: {
    ...mapActions('global', ['delCredentials', 'deleteProfile', 'initProfile', 'setCurrentAccount', 'removeAccount']),
    cancel () {
      this.$router.back()
    },
    async setAccountAsDefault () {
      try {
        this.msg = `Change to server ${this.account.user}@${this.account.servername}`
        await this.setCurrentAccount(this.account)
      } catch (err) {
        catched(err)
      } finally {
        this.msg = undefined
      }
    },
    async init () {
      console.log('init')
      try {
        this.msg = 'Changing keys with server'
        if (this.autorized) {
          const pass = await getPassword(`${this.user}@${this.server}`)
          await this.initProfile({ account: this.account, pass })
        }
      } catch (err) {
        catched(err)
      } finally {
        this.msg = undefined
      }
    },
    async removeProfile () {
      try {
        this.msg = 'Deleting profile'
        await this.deleteProfile(this.account)
      } catch (err) {
        catched(err)
      } finally {
        this.msg = undefined
      }
    },
    setCredentails () {
      const params = { server: this.server, user: this.user }
      this.$router.push({ name: 'login', params })
    },
    async removeCredentials () {
      const { user, server: servername } = this
      this.delCredentials({ user, servername })
    },
    async remove () {
      console.log('Remove account', this.account)
      this.removeAccount(this.account)
    }
  }
}
</script>
