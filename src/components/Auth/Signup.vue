<template>
  <div class="column absolute-center">
    <form @submit.prevent="send">
      <q-input type="text" max-length="16" autofocus
        v-model="form.username"
        label="Username"
        hint="Choose a username"
        @blur="$v.form.username.$touch"
      >
        <template v-slot:after>
          <q-icon v-if="$v.form.username.$error" name="warning" flat color="error"/>
          <q-icon v-else-if="!$v.form.username.$invalid" name="done" flat color="ok"/>
        </template>
      </q-input>
      <q-input type="email" max-length="50"
        v-model="form.email"
        label="Email"
        hint="Give a email to confirm"
        @blur="$v.form.email.$touch"
      >
        <template v-slot:after>
          <q-icon v-if="$v.form.email.$error" name="warning" flat color="error"/>
          <q-icon v-else-if="!$v.form.email.$invalid" name="done" flat color="ok"/>
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
          <q-icon v-if="$v.form.password.$error" name="warning" flat color="error"/>
          <q-icon v-else-if="!$v.form.password.$invalid" name="done" flat color="ok"/>
        </template>
      </q-input>
      <q-btn v-model="submiting" loader
        v-if="!askcode"
        rounded color="secondary"
        :disabled="!ready"
        @click="send"
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
          <q-icon v-if="codeinvalid" name="warning" flat color="error"/>
        </template>
      </q-input>
    </form>
    <div v-else>
      {{response}}
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { required, minLength, maxLength, email } from 'vuelidate/lib/validators'
import notify from 'src/mixins/notify'
import { mapGetters } from 'vuex'

const mustbedigits = (v = '') => Promise.resolve(v.match(/^\d{6}$/))
export default {
  name: 'register',
  data () {
    return {
      form: {
        username: '',
        password: '',
        email: ''
      },
      code: undefined,
      submiting: false,
      response: undefined
    }
  },
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
                console.log(msg)
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
        minLength: minLength(6)
      }
    }
  },
  computed: {
    ...mapGetters('global', ['server']),
    serverURL () {
      return `http://${this.server}:3000`
    },
    username () {
      return this.$v.form.username
    },
    email () {
      return this.$v.form.email
    },
    password () {
      return this.$v.form.password
    },
    ready () {
      return this.$v.form.$invalid === false
    },
    askcode () {
      return this.code !== undefined
    },
    codeinvalid () {
      return this.code && this.$v.code.minLength && this.$v.code.maxLength && this.$v.code.$invalid
    },
    confirmdata () {
      const { code = this.code, password, username, next = 0 } = this.form
      return { code, password, username, next }
    }
  },
  mixins: [notify],
  methods: {
    confirm () {
      this.$v.code.$touch()
      console.log('Code:', this.code)
      console.log('data', this.confirmdata)
      console.log('invalid', this.$v.code.$invalid)
      if (this.$v.code.$invalid) return
      return axios.post(`${this.serverURL}/auth/confirmbycode`, this.confirmdata)
        .then(({ data }) => {
          console.log(data)
          this.response = data.msg
          this.code = undefined
        })
        .catch((err) => {
          console.warn('Error', err)
          this.catch(err)
        })
    },
    send () {
      console.log('form', this.$v.form)
      if (this.$v.form.invalid) return
      this.submiting = true
      this.form.next = 0
      return axios.post(`${this.serverURL}/auth/signup`, this.form)
        .then(({ data }) => {
          console.log(data)
          this.response = data.msg
          this.code = null
        })
        .catch((err) => {
          console.warn('Error', err)
          this.catch(err)
        })
        .finally(() => {
          this.submiting = false
        })
    }
  },
  mounted () {
    // const resolved =
    // console.log('resolved', resolved)
    console.log('URL:', this.serverURL)
  }
}
</script>

<style lang="stylus">
</style>
