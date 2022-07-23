export function setSnaps (state, snaps) {
  state.snaps = snaps
}
export function useLastSnap (state) {
  state.currentSnap = state.snaps[state.snaps.length - 1]
}

export function setCurrentSnap (state, snap) {
  state.currentSnap = snap
}

export function clearSnaps (state, snap) {
  state.currentSnap = undefined
  state.snaps = []
}
