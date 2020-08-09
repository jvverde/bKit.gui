<template>
  <div class="fit column no-wrap items-center relative-position">
    <div class="q-mt-xl">Manage account: {{account}}@{{server}}</div>
    <q-btn class="absolute-top-right" flat round icon="cancel" @click="cancel" color="red" size="sm" />
  </div>
</template>

<script>

export default {
  name: 'Account',
  data () {
    return {
    }
  },
  props: ['server', 'account'],
  watch: {
  },
  methods: {
    cancel () {
      this.$router.back()
    }
  }
}
</script>
