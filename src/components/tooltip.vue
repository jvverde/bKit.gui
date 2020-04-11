<template>
  <q-tooltip anchor="top middle" self="center left"
    content-class="bg-grey-1 text-black shadow-4"
    :delay="650"
    :hide-delay="50"
    transition-show="scale"
    transition-hide="scale">
    <span>{{label}}</span>
  </q-tooltip>
</template>

<script>
export default {
  name: 'tooltip',
  data () {
    return {}
  },
  props: {
    label: {
      type: [String, Number],
      required: true
    }
  },
  methods: {
  },
  mounted () {
  }
}
</script>

<style scoped lang="scss">

</style>
