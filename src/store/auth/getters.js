export function accessToken (state) {
  return account => {
    const index = state.tokens.findIndex(s => s instanceof Object && s.account === account)
    if (index < 0) return undefined
    return state.tokens[index].token
  }
}
