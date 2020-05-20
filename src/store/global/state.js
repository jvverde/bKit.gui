import { getbkitlocation, isbkitok, isBkitClintInstalled } from 'src/helpers/check'

const bkitlocation = getbkitlocation()
const bkitinstalled = isBkitClintInstalled()
const bkitok = isbkitok()

export default function () {
  return {
    server: undefined,
    bkitlocation,
    bkitinstalled,
    bkitok
  }
}
