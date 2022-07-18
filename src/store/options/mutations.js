export function setOptions (state, option) {
  const options = state.options
  state.options = { ...options, option }
}
