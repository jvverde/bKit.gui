import { mount, createLocalVue } from '@vue/test-utils'
import Quasar, { QInput, QBtn, QIcon } from 'quasar'
import Vue from 'vue'
import sinon from 'sinon'

import Taskname from '../Taskname'
// import lang from 'quasar/lang/en-us' // change to any language you wish! => this breaks wallaby :(

Vue.use(Quasar)
const localVue = createLocalVue()

localVue.use(Quasar, {
  components: {
     QInput,
     QBtn,
     QIcon
  } // ,lang
})

const wrapper = mount(Taskname, {
  localVue
})

describe('TaskName.vue', () => {
  it('Taskname is a view instance', () => {
    expect(wrapper.isVueInstance).toBeTruthy()
  })
  it('Name is taskname', () => {
    expect(wrapper.name()).toBe('taskname')
  })
  it('QInput exists', () => {
    expect(wrapper.find(QInput).exists()).toBe(true)
  })

  const qinput = wrapper.find(QInput)

  const check = sinon.stub()
  wrapper.setMethods({ check })

  it('QInput emit blur', () => {
    qinput.vm.$emit('blur')
    expect(check.called).toBe(true)
  })
})
