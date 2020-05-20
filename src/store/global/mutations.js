import { ipcRenderer } from 'electron'
import { getbkitlocation, isbkitok, isBkitClintInstalled } from 'src/helpers/check'

export function setServer (state, server) {
  state.server = server
}
export function setbkitLocation (state, location) {
  if (!location) throw new Error('Location cannot be null')
  ipcRenderer.send('setbKitPath', location)
  state.bkitlocation = getbkitlocation()
  if (state.bkitlocation !== location) throw new Error('Location not properly set')
  checkbkitInstalled(state)
}
export function checkbkitInstalled (state) {
  state.bkitinstalled = isBkitClintInstalled(state.bkitlocation)
  checkbkitOk(state)
}
export function checkbkitOk (state) {
  state.bkitok = isbkitok()
}
