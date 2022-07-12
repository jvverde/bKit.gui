export function getList (state) {
  return state.list
}

export function getCompleted (state) {
  return state.done
}

export function getLastCompleted (state) {
  return state.done[state.done.length - 1]
}

export function show (state) {
  return state.show
}
export function empty (state) {
  return state.list.length === 0
}

export function isQueued (state) {
  return path => state.list.includes(path)
}

export function isDone (state) {
  return path => state.done.includes(path)
}
