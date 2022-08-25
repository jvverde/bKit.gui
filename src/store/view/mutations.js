const { normalize, join, sep } = window.electron.path

const LIMIT = 100

const equal = (x, y) => {
  const keys = Object.keys({ ...x, ...y })
  return keys.every(k => x[k] === y[k])
}

export function setView (state, view) {
  // We want to have the go back in the history posssibility
  // NOTE: we should implement this as an action where we can get LIMIT from a another moddle getter
  const path = normalize(view.path)
  const nview = { ...view, path }
  if (equal(nview, state.view)) {
    console.log('IS THE SAME FUCKING VIEW', nview, state.view)
    return
  }
  state.view = nview
  state.history.push(state.view)
  if (state.history.length > LIMIT) state.history.shift() // Limit history size
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
