import { normalize, join, sep } from 'path'
const LIMIT = 100
export function setView (state, path) {
  state.view = normalize(path)
  state.history.push(state.view)
  if (state.history.length > LIMIT) state.history.shift()
  state.index = state.history.length - 1
}

export function goUp (state) {
  const up = join(state.view, sep, '..', sep)
  setView(state, up)
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
