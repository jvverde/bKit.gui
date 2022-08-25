export function getview (state) {
  return state.view
}

export function canGoBack (state) {
  return state.index > 0
}

export function canGoForward (state) {
  return state.index < state.history.length - 1
}
