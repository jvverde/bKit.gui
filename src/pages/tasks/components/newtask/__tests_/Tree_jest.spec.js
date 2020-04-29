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

  const makeAncestors = (pathstr) => {
    pathstr = path.normalize(pathstr)
    if (!pathstr || pathstr === path.sep) return []
    const re = new RegExp(`(.+)\\${path.sep}[^\\${path.sep}]+\$`)
    const re1 = new RegExp(`\\${path.sep}\$`)
    const ancestors = []
    let str = pathstr.replace(re1,'')
    let result
    while ( (result = re.exec(str)) !== null) {
      str = result[1] // Parent is on first group
      ancestors.push(str)
    }
    if (ancestors.length === 0 && pathstr.startsWith(path.sep)) ancestors.push(path.sep)
    return ancestors
  }

  const paths = [
    ...['c:','c:/','c:/a','c:/a/b','c:/a/b/c','c:/a/b/c/','a','a/b','a/b/','a/b//','/','/a','/a/','/a/b','','//','///'].map(e => {
      const self = path.normalize(e) 
      const r = makeAncestors(self)
      return [self, r]
    }),
    ['', []],
    [null, []],
    [undefined, []]
  ]

  it.each(paths)('Ancestors of %s must be: %s', (path, ancestors) => {
    const wrapper = mountwith(path)
    expect(wrapper.vm.ancestors).toEqual(ancestors)
  })
})
