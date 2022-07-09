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
  return lastSnap(state) === state.lastSnap
}

export function currentSnapExists (state) {
  return state.snaps.some(s => s.snap === state.currentSnap.snap)
}

export function snapExists (state, snap) {
  return state.snaps.some(s => s.snap === snap.snap)
}
