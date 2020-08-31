<template>
  <div class="fit relative-position">
    <form v-on:submit.prevent class="q-px-xl q-py-sm q-gutter-y-sm column items-stretch absolute-center">
      <q-input type="text" max-length="16"
        v-model="form.username"
        autofocus
        label="Username"
        hint="Account Username"
        :error="$v.form.password.$error"
        @blur="$v.form.username.$touch"
        @keyup.enter="send"
        :disable="waitpass"
      >
        <template v-slot:after>
          <q-icon v-if="$v.form.username.$error" name="warning" flat color="error" size="xs"/>
          <q-icon v-else-if="!$v.form.username.$invalid" name="done" flat color="ok" size="xs"/>
        </template>
      </q-input>
      <q-btn v-model="submit"
        v-if="status === 0"
        loader
        label="Recover"
        no-caps
        rounded color="secondary"
        :disabled="!userReady"
        @click="set"
      />
      <q-input
        v-if="status > 0"
        type="text"
        maxlength="8"
        minlength="8"
        v-model="form.code"
        autofocus
        label="Code"
        hint="Code received by email">
        <template v-slot:after>
          <!--q-icon v-if="codeinvalid" name="warning" flat color="error" size="xs"/-->
        </template>
      </q-input>
      <q-input
        v-if="status > 1"
        type="password"
        max-length="16"
        v-model="form.password"
        label="Password"
        hint="Give a least 8 characters"
        @keyup.enter="set"
        :error="$v.form.password.$error"
        @blur="$v.form.password.$touch"
      >
        <template v-slot:after>
          <q-icon v-if="$v.form.password.$error" name="warning" flat color="error" size="xs"/>
          <q-icon v-else-if="!$v.form.password.$invalid" name="done" flat color="ok" size="xs"/>
        </template>
      </q-input>
      <q-input
        v-if="status > 1"
        type="password"
        max-length="16"
        v-model="form.passrepeat"
        label="Repeat Password"
        hint="Same as password"
        @keyup.enter="set"
        :error="$v.form.passrepeat.$error"
        @blur="$v.form.passrepeat.$touch"
      >
        <template v-slot:after>
          <q-icon v-if="$v.form.passrepeat.$error" name="warning" flat color="error" size="xs"/>
          <q-icon v-else-if="!$v.form.passrepeat.$invalid && !$v.form.password.$invalid" name="done" flat color="ok" size="xs"/>
        </template>
      </q-input>
      <q-btn v-model="submit"
        v-if="status > 1"
        loader
        label="Submit"
        no-caps
        rounded color="secondary"
        :disabled="!userReady"
        @click="set"
      />
    </form>
    <q-btn class="absolute-top-right" flat round icon="cancel" @click="cancel" color="red" size="sm" />
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
  </div>
</template>

<script>
import axios from 'axios'
import { required, minLength, maxLength, sameAs } from 'vuelidate/lib/validators'
import { catcher } from 'src/helpers/notify'
import { mapGetters } from 'vuex'
import crypto from 'crypto'

const mustbecaps = (v = '') => Promise.resolve(v.match(/^[A-Z]{8}$/))

const md5 = (msg) => {
  return crypto.createHash('md5')
    .update(msg)
    .digest('hex')
}

const hmac = (msg, pass) => {
  return crypto.createHmac('sha256', pass)
    .update(msg)
    .digest('hex')
}

const compose = ({ username, password, rand, code }) => {
  return {
    username,
    hmac: hmac(rand, code),
    password: md5(`${username}|bKit|${password}`),
    verify: md5(`${rand}${code}`)
  }
}

// const states = ['askUsername', 'waitcode', 'setpassword']
export default {
  name: 'ResetPass',
  data () {
    return {
      form: {
        username: '',
        password: '',
        passrepeat: '',
        code: undefined
      },
      response: {},
      status: 0,
      submit: false
    }
  },
  validations: {
    form: {
      code: {
        required,
        minLength: minLength(8),
        maxLength: maxLength(8),
        mustbecaps
      },
      username: {
        required,
        minLength: minLength(4),
        exists (value) {
          if (!this.$v.form.username.required || !this.$v.form.username.minLength) return Promise.resolve(false)
          console.log('Check if exists')
          return new Promise(async (resolve, reject) => {
            try {
              const { data: { msg } } = await axios.get(`${this.serverURL}/check/${value}`)
              resolve(msg === 'exists')
            } catch (err) {
              reject(err)
            }
          })
        }
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
    waitcode: {
      get () { return this.response && this.status === 1 },
      set () { this.status = 2 }
    },
    waitpass () { return this.status === 2 },
    userReady () {
      return !this.$v.form.username.$invalid && this.form.username
    },
    serverURL () {
      return this.getServerURL(this.server)
    }
  },
  props: ['server'],
  methods: {
    cancel () {
      this.$router.back()
    },
    async send () {
      if (!this.userReady) return
      try {
        this.submit = true
        const { data } = await axios.get(`${this.serverURL}/auth/reset_pass/${this.form.username}`)
        console.log('done', data)
        this.response = data
        this.status = 1
        this.code = undefined
      } catch (err) {
        catcher(err)
      } finally {
        this.submit = false
      }
    },
    async set () {
      try {
        this.submit = true
        const obj = compose({ ...this.form, ...this.response })
        console.log(obj)
      } catch (err) {
        catcher(err)
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
