import { Resource } from 'src/helpers/types'

const same = (a, b) => a.path === b.path && a.rvid === b.rvid && a.snap === b.snap

export function add2restore (state, resource) {
  if (!(resource instanceof Resource)) throw new Error(`${resource} is not a Resource`)
  if (state.list.find(e => same(e, resource))) {
    console.warn(resource, 'is already in restore list', state.list)
  } else {
    console.info('Add Resource', resource, ' to restore list')
    state.list.push(resource)
  }
}

export function rmResource (state, resource) {
  const i = state.list.findIndex(e => same(e, resource))
  if (i >= 0) state.list.splice(i, 1)
}

export function done (state, path) {
  if (state.done.includes(path)) {
    console.warn(`${path} is already in done list`)
  } else {
    console.info(`Add Path ${path} to done list`)
    state.done.push(path)
  }
}

export function show (state) {
  state.show = true
}

export function hide (state) {
  state.show = false
}

export function toggle (state) {
  state.show = !state.show
}
