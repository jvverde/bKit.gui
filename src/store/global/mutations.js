import { isBkitClintInstalled } from 'src/helpers/check'
import { ipcRenderer } from 'electron'

export function setServer (state, server) {
  state.server = server
}
export function setbkitLocation (state, location) {
  state.bkitlocation = location
  ipcRenderer.send('setbKitPath', location)
  state.bkitinstalled = isBkitClintInstalled(location)
}
export function setbkitInstalled (state, val) {
  state.bkitinstalled = val
}
export function checkbkitInstalled (state) {
  state.bkitinstalled = isBkitClintInstalled(state.bkitlocation)
}
export function setbkitok (state, val) {
  state.bkitok = val
}
