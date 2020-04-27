import { mount, createLocalVue } from '@vue/test-utils'
import Quasar from 'quasar'
import { components } from 'src/tests/quasar'
import Vue from 'vue'

import Tree from '../Tree'

Vue.use(Quasar)
const localVue = createLocalVue()

localVue.use(Quasar, components)

let wrapper = null

const path = require('path')
const mountwith = (path = '') => {
  return mount(Tree, {
    localVue,
    propsData: {
      entry: {
        path: path
      }
    }
  })
}

describe('Tree.vue', () => {
  const wrapper = mountwith()
  it('Tree is a view instance', () => {
    expect(wrapper.isVueInstance).toBeTruthy()
  })
  it('Name is tree', () => {
    expect(wrapper.name()).toBe('tree')
  })

  const makeAncestorsOrSelf = (string, sep = '/') => {
    if (!string) return []
    return string.split('/').reduce((result, value) => { // Create a list of ancestors paths
      const last = result[result.length - 1]
      const next = last ? [last, value].join(path.sep) : value
      return next ? [...result, next] : result
    }, [])
  }

  const paths = [
    ...['c:','c:/','c:/a','c:/a/b','c:/a/b/c','c:/a/b/c/','a','a/b','a/b/','a/b//','/','/a','/a/b'].map(e => {
      const r = makeAncestorsOrSelf(e) 
      return [r.pop(), r.reverse()]
    }),
    ['', []],
    [null, []],
    [undefined, []]
  ]

  it.each(paths)('Expected ancestors of %s to be %s', (path, ancestors) => {
    const wrapper = mountwith(path)
    expect(wrapper.vm.ancestors).toEqual(ancestors)
  })
})
