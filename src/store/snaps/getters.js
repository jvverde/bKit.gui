export function getSnaps (state) {
  return state.snaps
}
export function getCurrentSnap (state) {
  return state.snaps[state.currentIndex]
}
export function getLastSnap (state) {
  return state.snaps[state.snaps.length - 1]
}
export function isLastSnap (state) {
  return (state.snaps.length - 1) === state.currentIndex
}
