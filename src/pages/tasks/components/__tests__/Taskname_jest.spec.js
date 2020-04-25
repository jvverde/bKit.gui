import { mount, createLocalVue } from '@vue/test-utils'
import Quasar, { QInput, QBtn, QIcon } from 'quasar'
import Vue from 'vue'

import Taskname from '../Taskname'
import lang from 'quasar/lang/en-us' // change to any language you wish! => this breaks wallaby :(

Vue.use(Quasar)

describe('TaskName.vue', () => {
  const localVue = createLocalVue()
  localVue.use(Quasar, {
    components: {
       QInput,
       QBtn,
       QIcon
    },
    lang
  })
  it('renders a taskname', () => {
    const wrapper = mount(Taskname, {
      localVue
    })
    console.log(wrapper.html())
  })
})
