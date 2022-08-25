const lastSnap = state => state.snaps[state.snaps.length - 1]
const isEqual = (a, b) => a && b && a.id === b.id && a.uuid === b.uuid &&
  a.volume === b.volume && a.name === b.name && a.user === b.user && a.domain === b.domain

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
  return isEqual(lastSnap(state), state.currentSnap)
}
