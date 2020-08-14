<template>
  <div class="fit relative-position">
    <div class="q-px-xl q-py-sm q-gutter-y-xl column items-stretch absolute-center">
      <form @submiting.prevent="send" class="column items-stretch">
        <q-input
          :readonly="specificUser"
          type="text"
          max-length="16"
          :autofocus="!specificUser"
          v-model="form.username"
          float-label="Username"
          :error="$v.form.username.$error"
          @blur="$v.form.username.$touch"
          @keyup.enter="send"
        />
        <q-input
          type="password"
          max-length="16"
          v-model="form.password"
          :autofocus="specificUser"
          float-label="Password"
          :error="$v.form.password.$error"
          @blur="$v.form.password.$touch"
          @keyup.enter="send"
        />
        <q-btn
          rounded color="secondary"
          :disabled="!ready"
          @click="send"
        >Sign In</q-btn>
        <router-link
          to="/reset_pass"
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
import axios from 'axios'
import { required } from 'vuelidate/lib/validators'
import notify from 'src/mixins/notify'
import { mapGetters, mapActions } from 'vuex'

const crypto = require('crypto')

const md5 = (msg) => {
  const hash = crypto.createHash('md5')
  hash.update(msg)
  return hash.digest('hex')
}

const compose = ({ username, password }) => {
  return {
    username,
    password: md5(`${username}|bKit|${password}`)
  }
}

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
    }
  },
  methods: {
    ...mapActions('global', ['addAccount']),
    cancel () {
      this.$router.back()
    },
    async send () {
      if (!this.ready) return
      this.submiting = true
      try {
        const cred = compose(this.form)
        await axios.post(`${this.serverURL}/auth/login`, cred)
        this.addAccount({ user: cred.username, server: this.server, password: cred.password })
        this.$router.back()
      } catch (err) {
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
