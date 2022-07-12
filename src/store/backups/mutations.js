export function add2backup (state, path) {
  if (state.list.includes(path)) {
    console.warn(`${path} is already in backup list`)
  } else {
    console.info(`Add Path ${path} to backup list`)
    state.list.push(path)
    state.show = true
  }
}
export function rmPath (state, path) {
  const i = state.list.indexOf(path)
  if (i >= 0) state.list.splice(i, 1)
}

export function show (state, path) {
  state.show = true
}
export function hide (state, path) {
  state.show = false
}
export function toggle (state, path) {
  state.show = !state.show
}

export function done (state, path) {
  const i = state.done.findIndex(e => e.path === path)
  if (i >= 0) state.done.splice(i, 1) // Remove if already present
  console.info(`Add Path ${path} to tail of done list`)
  const date = new Date()
  state.done.push({ path, date }) // Always add it to tail
}
