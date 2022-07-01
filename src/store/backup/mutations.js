export function addPath (state, path) {
  state.list.push(path)
}
export function rmPath (state, path) {
  const i = state.list.indexOf(path)
  if (i >= 0) state.list.splice(i, 1)
}
