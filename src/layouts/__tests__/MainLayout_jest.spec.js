import { mount, createLocalVue } from '@vue/test-utils'
import Quasar from 'quasar'
import { components } from 'src/tests/quasar'
import Vue from 'vue'
import Vuex from 'vuex'
import global from 'src/store/global'
import VueRouter from 'vue-router'

jest.mock('electron')
jest.mock('src/helpers/bash')
// jest.mock('src/helpers/bkit')

import MainLayout from '../MainLayout'


Vue.use(Quasar)
const localVue = createLocalVue()

localVue.use(Vuex)
localVue.use(VueRouter)
localVue.use(Quasar, components)

let wrapper = null

beforeEach(() => {
  const router = new VueRouter()
  const store = new Vuex.Store({
    modules: {
      global
    }
  })
  wrapper = mount(MainLayout, { store, router, localVue })
})

afterEach(() => {
    wrapper.destroy()
})

describe('MainLayout.vue', () => {
  it('MainLayout is a view instance', () => {
    expect(wrapper.isVueInstance).toBeTruthy()
  })
})
