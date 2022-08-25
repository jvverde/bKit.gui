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

export function show (state) {
  state.show = true
}
export function hide (state) {
  state.show = false
}
export function toggle (state) {
  state.show = !state.show
}

export function done (state, backup) {
  const i = state.done.findIndex(e => e.path === backup.path)
  if (i >= 0) state.done.splice(i, 1) // Remove if already present
  console.info(`Add Path ${backup.path} to tail of done list`)
  const date = new Date()
  state.done.push({ ...backup, date }) // Always add it to tail
}
