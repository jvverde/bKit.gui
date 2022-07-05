export function add2backup (state, path) {
  if (state.list.includes(path)) {
    console.warn(`${path} is already in backup list`)
  } else {
    console.info(`Add Path ${path} to bakup list`)
    state.list.push(path)
  }
}
export function rmPath (state, path) {
  const i = state.list.indexOf(path)
  if (i >= 0) state.list.splice(i, 1)
}
