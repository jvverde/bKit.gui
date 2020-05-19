import { ipcRenderer } from 'electron'
import { isBkitClintInstalled } from 'src/helpers/check'
import { bkitping } from 'src/helpers/bash'

const isbkitok = () => bkitping('aqui') === 'aqui'

const bkitlocation = ipcRenderer.sendSync('getbKitPath')
const bkitinstalled = bkitlocation && isBkitClintInstalled(bkitlocation)
const bkitok = bkitinstalled && isbkitok()

export default function () {
  return {
    server: undefined,
    bkitlocation,
    bkitinstalled,
    bkitok
  }
}
