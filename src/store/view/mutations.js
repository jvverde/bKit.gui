import { normalize, join, sep } from 'path'
const LIMIT = 100
export function setView (state, view) {
  // we should implemt this as an action where we can get LIMIt from a another moddle getter
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
  }
}

export function goForward (state) {
  if (state.index < state.history.length - 1) {
    state.view = state.history[++state.index]
  }
}
