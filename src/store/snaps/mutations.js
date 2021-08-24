export function setView (state, path) {
  state.view = path
}
export function setSnaps (state, snaps) {
  state.snaps = snaps
}
export function useLastSnap (state) {
  state.currentIndex = state.snaps.length - 1
}
export function setCurrentSnap (state, index) {
  state.currentIndex = index
}
