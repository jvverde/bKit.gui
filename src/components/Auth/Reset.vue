<template>
  <div class="fit relative-position">
    <div class="q-px-xl q-py-sm q-gutter-y-xl column items-stretch absolute-center">
      <q-input type="text" max-length="16"
        v-model="form.username"
        autofocus
        label="Username"
        hint="Account Username"
        :error="$v.form.password.$error"
        @blur="$v.form.username.$touch"
        @keyup.enter="send"
      >
        <template v-slot:after>
          <q-icon v-if="$v.form.username.$error" name="warning" flat color="error" size="xs"/>
          <q-icon v-else-if="!$v.form.username.$invalid" name="done" flat color="ok" size="xs"/>
        </template>
      </q-input>
      <q-btn v-model="submit"
        loader
        label="Recover"
        no-caps
        rounded color="secondary"
        :disabled="!userReady"
        @click="send"
      />
    </div>
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

const mustbedigits = (v = '') => Promise.resolve(v.match(/^\d{6}$/))

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
      submit: false
    }
  },
  validations: {
    form: {
      code: {
        required,
        minLength: minLength(8),
        maxLength: maxLength(8),
        mustbedigits
      },
      username: {
        required,
        minLength: minLength(4),
        exists (value) {
          if (!this.$v.form.username.required || !this.$v.form.username.minLength) return Promise.resolve(false)
          console.log('Check if exists')
          return new Promise((resolve, reject) => {
            axios.get(`${this.serverURL}/check/${value}`)
              .then(({ data: { msg } }) => {
                resolve(msg === 'exists')
              })
              .catch((err) => {
                this.catch(err)
                reject(err)
              })
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
      get () { return this.response && this.response.status === 'wait' },
      set () { this.response.status = 'waitcode' }
    },
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
        const response = await axios.get(`${this.serverURL}/auth/reset_pass/${this.form.username}`)
        console.log('done', response.data)
        this.response = response.data
        this.code = undefined
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
