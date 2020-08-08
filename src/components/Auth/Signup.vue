<template>
  <div class="column absolute-center">
    server:{{server}}
    <form @submit.prevent="send" class="column items-stretch">
      <q-input type="text" max-length="16"
        v-model="form.username"
        label="Username"
        hint="Choose a username"
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
        :error="$v.form.passrepeat.$error"
        @blur="$v.form.passrepeat.$touch"
      >
        <template v-slot:after>
          <q-icon v-if="$v.form.passrepeat.$error" name="warning" flat color="error" size="xs"/>
          <q-icon v-else-if="!$v.form.passrepeat.$invalid && !$v.form.password.$invalid" name="done" flat color="ok" size="xs"/>
        </template>
      </q-input>
      <q-btn v-model="submiting" loader
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
      <q-input type="text" maxlength="6" minlength="6"
        v-model="code"
        label="Code"
        @keyup="confirm"
        hint="Code received by email">
        <template v-slot:after>
          <q-icon v-if="codeinvalid" name="warning" flat color="error" size="xs"/>
        </template>
      </q-input>
    </form>
    <q-btn class="absolute-top-right" flat round icon="cancel" @click="cancel" color="red" size="sm" />
    <q-dialog v-model="waitcode" transition-show="flip-down" transition-hide="flip-up">
      <q-card>
        <q-card-section v-if="response.email">
          A code has been sent to mail address {{response.email}}
        </q-card-section>
        <q-card-section>
          Please check you email and then enter it on field Code bellow
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="OK" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import { required, minLength, maxLength, email, sameAs } from 'vuelidate/lib/validators'
import notify from 'src/mixins/notify'
import { mapGetters } from 'vuex'
import { addAccount } from 'src/helpers/credentials'

const crypto = require('crypto')

const md5 = (msg) => {
  const hash = crypto.createHash('md5')
  hash.update(msg)
  return hash.digest('hex')
}

const compose = ({ username, password, email }, extra) => {
  return {
    username,
    email,
    password: md5(`${username}|bKit|${password}`),
    ...extra
  }
}

const mustbedigits = (v = '') => Promise.resolve(v.match(/^\d{6}$/))

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
      minLength: minLength(6),
      maxLength: maxLength(6),
      mustbedigits
    },
    form: {
      username: {
        required,
        minLength: minLength(4),
        isUnique (value) {
          if (!this.$v.form.username.required || !this.$v.form.username.minLength) return Promise.resolve(false)
          return new Promise((resolve, reject) => {
            axios.get(`${this.serverURL}/check/${value}`)
              .then(({ data: { msg } }) => {
                resolve(msg === 'available')
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
    ...mapGetters('global', ['serverURL']),
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
    }
  },
  mixins: [notify],
  methods: {
    cancel () {
      this.$router.back()
    },
    async confirm () {
      this.$v.code.$touch()
      if (!this.ready2confirm) return
      try {
        const obj = compose(this.form, { next: 0, code: this.code })
        const { data } = await axios.post(`${this.serverURL}/auth/confirmbycode`, obj)
        this.response = data
        this.code = undefined
        addAccount(`${obj.username}@${this.server}`, obj.password)
        this.$router.back()
      } catch (err) {
        this.catch(err)
      }
    },
    async send () {
      if (!this.ready) return
      try {
        this.submiting = true
        const obj = compose(this.form, { next: 0 })
        const { data } = await axios.post(`${this.serverURL}/auth/signup`, obj)
        this.response = data
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
