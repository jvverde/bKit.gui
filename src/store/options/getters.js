export function getOptions (state) {
  return state.options
}
export function getOption (state) {
  return option => state.options[option]
}
