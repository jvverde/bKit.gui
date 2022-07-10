const lastSnap = state => state.snaps[state.snaps.length - 1]

export function getSnaps (state) {
  return state.snaps
}

export function getCurrentSnap (state) {
  return state.currentSnap
}

export function getLastSnap (state) {
  return lastSnap(state)
}

export function isLastSnap (state) {
  return lastSnap(state) === state.currentSnap
}
