import { mount, createLocalVue } from '@vue/test-utils'
import Quasar from 'quasar'
import { components } from 'src/tests/quasar'
import Vue from 'vue'

import Schedule from '../Schedule'

const { QInput, QOptionGroup } = components

Vue.use(Quasar)
const localVue = createLocalVue()

localVue.use(Quasar, components)

let wrapper = null

beforeEach(() => {
    wrapper = mount(Schedule, { localVue })
})

afterEach(() => {
    wrapper.destroy()
})

describe('Schedule.vue', () => {
  it('Taskname is a view instance', () => {
    expect(wrapper.isVueInstance).toBeTruthy()
  })
  it('Name is schedule', () => {
    expect(wrapper.name()).toBe('schedule')
  })
  it('QInput exists', () => {
    expect(wrapper.find(QInput).exists()).toBe(true)
  })
  it('QOptionGroup exists', () => {
    expect(wrapper.find(QOptionGroup).exists()).toBe(true)
  })
})
