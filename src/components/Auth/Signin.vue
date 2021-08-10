<template>
  <div class="fit relative-position">
    <div class="q-px-xl q-py-sm q-gutter-y-xl column items-stretch absolute-center">
      <form @submiting.prevent="signin" class="column items-stretch">
        <q-input
          :readonly="specificUser"
          type="text"
          max-length="16"
          :autofocus="!specificUser"
          v-model="form.username"
          label="Username"
          :error="$v.form.username.$error"
          @blur="$v.form.username.$touch"
          @keyup.enter="signin"
        />
        <q-input
          type="password"
          max-length="16"
          v-model="form.password"
          :autofocus="specificUser"
          label="Password"
          :error="$v.form.password.$error"
          @blur="$v.form.password.$touch"
          @keyup.enter="signin"
        />
        <q-btn
          rounded color="secondary"
          :disabled="!ready"
          @click="signin"
        >Sign In</q-btn>
        <router-link
          :to="{ name: 'ResetPass', params: { server: server } }"
          class="thin-paragraph text-right"
          style="margin:.5em 0"
        >
          <small>Forgot Password?</small>
        </router-link>
      </form>
      <div v-if="!user" class="row items-center full-width q-gutter-x-sm">
        <div>Or</div>
        <q-btn rounded outline color="secondary" style="flex-grow: 1"
          @click="$router.replace({ name: 'signup', params: { server } })"
        >Sign up</q-btn>
      </div>
    </div>
    <q-inner-loading :showing="submiting">
      <q-spinner-ios size="xl" color="loader"/>
    </q-inner-loading>
    <q-btn class="absolute-top-right" flat round icon="cancel" @click="cancel" color="red" size="sm" />
  </div>
</template>

<script>

import { required } from 'vuelidate/lib/validators'
import notify from 'src/mixins/notify'
import { mapGetters, mapActions } from 'vuex'
import { hash } from 'src/helpers/secrets'

export default {
  name: 'Login',
  components: {
  },
  data () {
    return {
      form: {
        username: '',
        password: ''
      },
      submiting: false
    }
  },
  props: ['server', 'user'],
  validations: {
    form: {
      username: {
        required
      },
      password: {
        required
      }
    }
  },
  mixins: [notify],
  computed: {
    ...mapGetters('global', ['getServerURL']),
    serverURL () {
      return this.getServerURL(this.server)
    },
    ready () {
      return !this.$v.form.$error && this.form.username && this.form.password
    },
    specificUser () {
      return this.user && this.user.length > 0
    },
    password () { return this.form.password },
    username () { return this.form.username },
    hashpass () { return hash(this.password) }
  },
  methods: {
    ...mapActions('global', ['addAccount']),
    ...mapActions('auth', ['login']),
    cancel () {
      this.$router.back()
    },
    async signin () {
      if (!this.ready) return
      this.submiting = true
      try {
        const { username, serverURL, server, hashpass } = this
        const info = await this.login({ username, serverURL, hashpass })
        console.log('Info:', info)
        this.addAccount({ user: username, server, password: hashpass })
        this.$router.back()
      } catch (err) {
        console.warn(err)
        this.catch(err)
      } finally {
        this.submiting = false
      }
    }
  },
  mounted () {
    this.form.username = this.user || ''
  }
}
</script>

<style lang="stylus">
</style>
