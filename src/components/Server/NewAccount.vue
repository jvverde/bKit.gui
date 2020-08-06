<template>
  <div class="fit column no-wrap items-center relative-position">
    <div class="q-ma-xl q-px-xl full-width">
      <q-btn-toggle
        v-model="operation"
        spread
        no-caps
        toggle-color="primary"
        color="white"
        text-color="black"
        :options="options"
      />
    </div>
    <div class="fit relative-position routerview">
      <router-view></router-view>
    </div>
    <q-btn class="absolute-top-right" flat round icon="cancel" @click="cancel" color="red" size="sm" />
  </div>
</template>

<script>

export default {
  name: 'ServerUsers',
  data () {
    return {
      operation: 'signup',
      options: [
        { label: 'Sign-in', value: 'signin' },
        { label: 'Sign-up', value: 'signup' }
      ],
      hCnt: 1
    }
  },
  props: ['server'],
  watch: {
    operation: {
      immediate: true,
      handler (val, old) {
        if (val && val !== old) this.$router.replace(`/servers/${this.server}/new/account/${val}`)
      }
    }
  },
  methods: {
    cancel () {
      this.$router.back()
    }
  }
}
</script>
