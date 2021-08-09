<template>
  <div class="fit relative-position">
    <div class="q-px-xl q-py-sm column absolute-center">
      <form @submit.prevent="send" class="column items-stretch">
        <q-input type="text" max-length="16"
          v-model="form.username"
          label="Username"
          hint="Choose a username"
          @keyup.enter="send"
          @blur="$v.form.username.$touch"
        >
          <template v-slot:after>
            <q-icon v-if="$v.form.username.$error" name="warning" flat color="error" size="xs"/>
            <q-icon v-else-if="!$v.form.username.$invalid" name="done" flat color="ok" size="xs"/>
          </template>
        </q-input>
        <q-input type="email" max-length="50"
          v-model="form.email"
          label="Email"
          hint="Give a email to confirm"
          @keyup.enter="send"
          @blur="$v.form.email.$touch"
        >
          <template v-slot:after>
            <q-icon v-if="$v.form.email.$error" name="warning" flat color="error" size="xs"/>
            <q-icon v-else-if="!$v.form.email.$invalid" name="done" flat color="ok" size="xs"/>
          </template>
        </q-input>
        <q-input type="password" max-length="16"
          v-model="form.password"
          label="Password"
          hint="Give a least 8 characters"
          @keyup.enter="send"
          :error="$v.form.password.$error"
          @blur="$v.form.password.$touch"
        >
          <template v-slot:after>
            <q-icon v-if="$v.form.password.$error" name="warning" flat color="error" size="xs"/>
            <q-icon v-else-if="!$v.form.password.$invalid" name="done" flat color="ok" size="xs"/>
          </template>
        </q-input>
        <q-input type="password" max-length="16"
          v-model="form.passrepeat"
          label="Repeat Password"
          hint="Same as password"
          @keyup.enter="send"
          :error="$v.form.passrepeat.$error"
          @blur="$v.form.passrepeat.$touch"
        >
          <template v-slot:after>
            <q-icon v-if="$v.form.passrepeat.$error" name="warning" flat color="error" size="xs"/>
            <q-icon v-else-if="!$v.form.passrepeat.$invalid && !$v.form.password.$invalid" name="done" flat color="ok" size="xs"/>
          </template>
        </q-input>
        <q-btn
          v-if="!askcode"
          rounded color="secondary"
          :disabled="!ready"
          @click="send"
          class="q-mt-xl"
        >
          Sign up
        </q-btn>
      </form>
      <form @submit.prevent="confirm" v-if="askcode">
        <q-input type="text" maxlength="8" minlength="8"
          v-model="code"
          autofocus
          label="Code"
          @keyup="confirm"
          hint="Code received by email">
          <template v-slot:after>
            <q-icon v-if="codeinvalid" name="warning" flat color="error" size="xs"/>
          </template>
        </q-input>
      </form>
      <q-dialog v-model="waitcode" transition-show="flip-down" transition-hide="flip-up">
        <q-card>
          <q-card-section v-if="response.email">
            A code has been sent to your email {{response.email}}
          </q-card-section>
          <q-card-section>
            Please check you email and then enter it on field Code bellow
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="OK" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>
      <q-inner-loading :showing="submiting">
        <q-spinner-ios size="xl" color="loader"/>
      </q-inner-loading>
    </div>
  <q-btn class="absolute-top-right" flat round icon="cancel" @click="cancel" color="red" size="sm" />
  </div>
</template>

<script>
import axios from 'axios'
import { required, minLength, maxLength, email, sameAs } from 'vuelidate/lib/validators'
import notify from 'src/mixins/notify'
import { mapGetters, mapActions } from 'vuex'
import { hash, hmac, decrypt } from 'src/helpers/secrets'
// import { addAccount } from 'src/helpers/credentials'

const compose = ({ username, password, email }, extra = {}) => {
  // { email, username, hashpass }
  return {
    username,
    email,
    hashpass: hash(password),
    ...extra
  }
}

const mustbe8UpperChars = (v = '') => Promise.resolve(v.match(/^[A-Z]{8}$/))

export default {
  name: 'register',
  data () {
    return {
      form: {
        username: '',
        password: '',
        passrepeat: '',
        email: ''
      },
      code: undefined,
      submiting: false,
      response: {}
    }
  },
  props: ['server'],
  validations: {
    code: {
      required,
      minLength: minLength(8),
      maxLength: maxLength(8),
      mustbe8UpperChars
    },
    form: {
      username: {
        required,
        minLength: minLength(4),
        isUnique (value) {
          if (!this.$v.form.username.required || !this.$v.form.username.minLength) return Promise.resolve(false)
          return new Promise((resolve, reject) => {
            console.log(`Check ${value}`)
            axios.get(`${this.serverURL}/v1/auth/check/${value}`)
              .then(({ data: { message } }) => {
                resolve(message === 'available')
              })
              .catch((err) => {
                this.catch(err)
                reject(err)
              })
          })
        }
      },
      email: {
        required,
        email
      },
      password: {
        required,
        minLength: minLength(8)
      },
      passrepeat: {
        required,
        sameAs: sameAs('password')
      }
    }
  },
  computed: {
    ...mapGetters('global', ['getServerURL']),
    serverURL () {
      return this.getServerURL(this.server)
    },
    ready () {
      return this.$v.form.$invalid === false
    },
    ready2confirm () {
      return this.$v.code.$invalid === false && this.$v.form.$invalid === false
    },
    askcode () {
      return this.code !== undefined
    },
    codeinvalid () {
      return this.code && this.$v.code.minLength && this.$v.code.maxLength && this.$v.code.$invalid
    },
    waitcode: {
      get () { return this.response && this.response.status === 'wait' },
      set () { this.response.status = 'waitcode' }
    },
    password () { return this.form.password },
    username () { return this.form.username },
    email () { return this.form.email },
    hashpass () { return hash(this.password) }
  },
  mixins: [notify],
  methods: {
    ...mapActions('global', ['addAccount']),
    cancel () {
      this.$router.back()
    },
    async confirm () {
      this.$v.code.$touch()
      if (!this.ready2confirm) return
      try {
        this.submiting = true
        const challenge = decrypt(this.response.echallenge, this.code)
        const proof = hmac(challenge, this.hashpass)
        const confirm = { email: this.email, username: this.username, proof }
        const { data: response } = await axios.post(`${this.serverURL}/v1/auth/confirm`, confirm)
        this.response = response
        this.code = undefined
        this.addAccount({ user: this.username, server: this.server, password: this.hashpass })
        this.$router.back()
      } catch (err) {
        this.catch(err)
      } finally {
        this.submiting = false
      }
    },
    async send () {
      if (!this.ready) return
      try {
        this.submiting = true
        const obj = compose(this.form)
        // /v1/auth/signup', { email, username, hashpass }
        const { data: response } = await axios.post(`${this.serverURL}/v1/auth/signup`, obj)
        this.response = response
        this.code = null
      } catch (err) {
        this.catch(err)
      } finally {
        this.submiting = false
      }
    }
  }
}
</script>

<style lang="stylus">
</style>
