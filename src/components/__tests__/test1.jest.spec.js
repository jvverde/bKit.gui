import { mount, shallowMount, createLocalVue } from '@vue/test-utils'
import tooltip from '../tooltip.vue'

describe('tooltip.vue', () => {

  const label = 'This is my rifle'
  const wrapper = mount(tooltip, {
    stubs: {
      qTooltip: true
    },
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