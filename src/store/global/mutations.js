export function setServer (state, server = {}) {
  if (typeof server !== 'object') server = { address: server }
  const { address, hport = 8765, iport = 8760, bport = 8761, rport = 8762, uport = 8763 } = server
  state.server = {
    address,
    hport,
    iport,
    bport,
    rport,
    uport
  }
}
