export function setToken (state, { account, token }) {
  const index = state.tokens.findIndex(s => s instanceof Object && s.account === account)
  if (index >= 0) {
    state.tokens.splice(index, 1, { account, token })
  } else {
    state.tokens.push({ account, token })
  }
}
