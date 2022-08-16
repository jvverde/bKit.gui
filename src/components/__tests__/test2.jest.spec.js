import { mount, shallowMount, createLocalVue } from '@vue/test-utils'
import tooltip from '../tooltip.vue'

import * as All from 'quasar'
const { Quasar } = All

const components = Object.keys(All).reduce((object, key) => {
  const val = All[key]
  if (val && val.component && val.component.name != null) {
    object[key] = val
  }
  return object
}, {})

describe('tooltip.vue', () => {
  const localVue = createLocalVue()
  localVue.use(Quasar, { components }) // , lang: langEn

  const label = 'This is my rifle'
  const wrapper = shallowMount(tooltip, {
    localVue,
    propsData: {
      label
    }
  })
  const vm = wrapper.vm
  console.log(wrapper.html())
  it('renders a tooltip', () => {
    // expect(typeof vm.increment).toBe('function')
    expect(wrapper.text()).toMatch(label)
  })
})