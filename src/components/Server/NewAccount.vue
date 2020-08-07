<template>
  <div class="fit column no-wrap items-center relative-position">
    <div class="q-my-xl">
      <q-btn-toggle
        v-model="operation"
        no-caps
        toggle-color="primary"
        flat
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
  name: 'NewAccount',
  data () {
    return {
      operation: 'signin',
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
      handler (name, old) {
        if (!name || name === old) return
        this.$router.replace({
          name,
          params: { server: this.server }
        })
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
