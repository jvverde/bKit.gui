import { mount, createLocalVue } from '@vue/test-utils'
import { Quasar, components } from 'src/tests/quasar'
import Vue from 'vue'
import sinon from 'sinon'

jest.mock('windows-scheduler')
import { get } from 'windows-scheduler'

import Taskname from '../Taskname'


Vue.use(Quasar)
const localVue = createLocalVue()

localVue.use(Quasar, components)

let wrapper = null

beforeEach(() => {
    wrapper = mount(Taskname, { localVue })
})

afterEach(() => {
    wrapper.destroy()
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

  it('QInput emit blur and called check', () => {
    const qinput = wrapper.find(QInput)
    const check = sinon.stub()
    wrapper.setMethods({ check })
    
    qinput.vm.$emit('blur')
    expect(check.called).toBe(true)
  })
  it('Call check method and get resolve', done => {
    get.mockReturnValue(Promise.resolve())
    wrapper.vm.value = 'aaa'
    wrapper.vm.check()
    wrapper.vm.$nextTick(() => {
      expect(wrapper.vm.valid).toBe(false)
      expect(wrapper.vm.invalid).toBe(true)
      done()
    })
  })
  it('Call check method and get reject', done => {
    get.mockReturnValue(Promise.reject())
    wrapper.vm.value = 'aaa'
    wrapper.vm.check()
    wrapper.vm.$nextTick(() => {
      expect(wrapper.vm.valid).toBe(true)
      expect(wrapper.vm.invalid).toBe(false)
      done()
    })
  })
})
