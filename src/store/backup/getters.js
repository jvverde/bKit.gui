export function getList (state) {
  return state.list
}

export function isQueued (state) {
  return path => state.list.includes(path)
}
