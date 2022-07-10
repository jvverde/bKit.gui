import { normalize, join, sep } from 'path'
const LIMIT = 100
export function setView (state, view) {
  const path = normalize(view.path)
  state.view = { ...view, path }
  state.history.push(state.view)
  if (state.history.length > LIMIT) state.history.shift()
  state.index = state.history.length - 1
}

export function goUp (state) {
  const path = join(state.view.path, sep, '..', sep)
  setView(state, { ...state.view, path })
}

export function goBack (state) {
  if (state.index > 0) {
    state.view = state.history[--state.index]
    console.log(state.index, state.history.map(e => e.path))
  }
}

export function goForward (state) {
  if (state.index < state.history.length - 1) {
    state.view = state.history[++state.index]
  }
}
