<template>
  <div class="column absolute-center">
    <q-input
      type="text"
      max-length="16"
      autofocus
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
      float-label="Password"
      :error="$v.form.password.$error"
      @blur="$v.form.password.$touch"
      @keyup.enter="send"
    />
    <router-link
      to="/reset_pass"
      class="thin-paragraph text-right"
      style="margin:.5em 0"
    >
      <small>Forgot Password?</small>
    </router-link>
    <q-btn
      v-model="submit"
      loader
      rounded color="secondary"
      :disabled="!ready"
      @click="send"
    >Sign In</q-btn>
    <div class="text-center" style="margin:1em">Or</div>
    <q-btn rounded color="secondary"
      @click="$router.replace({ name: 'signup', params: { server } })"
    >Sign up</q-btn>
  </div>
</template>

<script>
import axios from 'axios'
import { required } from 'vuelidate/lib/validators'
import notify from 'src/mixins/notify'
import { mapGetters } from 'vuex'
import { addAccount } from 'src/helpers/credentials'

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
      submit: false
    }
  },
  props: ['server'],
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
    }
  },
  methods: {
    async send () {
      if (!this.ready) return
      this.submit = true
      try {
        const cred = compose(this.form)
        await axios.post(`${this.serverURL}/auth/login`, cred)
        addAccount(`${cred.username}@${this.server}`, cred.password)
        this.$router.back()
      } catch (err) {
        this.catch(err)
      } finally {
        this.submit = false
      }
    }
  },
  mounted () {
  }
}
</script>

<style lang="stylus">
</style>
