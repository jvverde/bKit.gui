<!-- got idea from here https://stackoverflow.com/questions/50800945/vue-wrap-another-component-passing-props-and-events -->
<template>
  <component :is="type" v-bind="$attrs" v-on="$listeners">
    <slot/>
    <tooltip :label="hint"/>
  </component>
</template>

<script>
import tooltip from './tooltip'

const wrap = {
  name: 'hint',
  components: {
    tooltip
  },
  props: ['type', 'hint'],
  inheritAttrs: false
}

export default wrap

export const bBtn = {
  name: 'bkitButton',
  components: {
    wrap
  },
  inheritAttrs: false,
  template: '<wrap type="q-btn" v-bind="$attrs" v-on="$listeners"><slot/></wrap>'
}

export const bIcon = {
  name: 'bkitIcon',
  components: {
    wrap
  },
  inheritAttrs: false,
  template: '<wrap type="q-icon" v-bind="$attrs" v-on="$listeners"><slot/></wrap>'
}

export const bBadge = {
  name: 'bkitBadge',
  components: {
    wrap
  },
  inheritAttrs: false,
  template: '<wrap type="q-badge" v-bind="$attrs" v-on="$listeners"><slot/></wrap>'
}

export const bTab = {
  name: 'bkitTab',
  components: {
    wrap
  },
  inheritAttrs: false,
  template: '<wrap type="q-tab" v-bind="$attrs" v-on="$listeners"><slot/></wrap>'
}

</script>
