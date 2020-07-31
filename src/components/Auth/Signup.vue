<template>
  <div class="column absolute-center">
    <form @submit.prevent="send" v-if="ask">
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
        rounded color="secondary"
        :disabled="!ready"
        @click="send"
      >
        Sign up
      </q-btn>
    </form>
    <div v-else>
      {{response}}
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { required, minLength, email } from 'vuelidate/lib/validators'
import notify from 'src/mixins/notify'
import { mapGetters } from 'vuex'

export default {
  name: 'register',
  data () {
    return {
      form: {
        username: '',
        password: '',
        email: ''
      },
      submiting: false,
      response: undefined
    }
  },
  validations: {
    form: {
      username: {
        required,
        minLength: minLength(4),
        isUnique (value) {
          if (!this.$v.form.username.required || !this.$v.form.username.minLength) return Promise.resolve(false)
          return new Promise((resolve, reject) => {
            axios.get(`/check/${value}`)
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
      return `http//${this.server}:3000/`
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
      return this.$v.$invalid === false
    },
    ask () {
      return !this.response
    }
  },
  mixins: [notify],
  methods: {
    send () {
      console.log('form', this.$v.form)
      if (this.$v.form.invalid) return
      this.submiting = true
      this.form.next = 0
      return axios.post('/auth/signup', this.form)
        .then(({ data }) => {
          console.log(data)
          this.response = data.msg
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
