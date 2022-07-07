export function getList (state) {
  return state.list
}

export function getDone (state) {
  return state.done
}

export function isQueued (state) {
  return path => state.list.includes(path)
}

export function isDone (state) {
  return path => state.done.includes(path)
}
