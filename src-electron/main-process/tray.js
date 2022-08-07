import {
  Tray,
  Menu
} from 'electron'

import say from './say'
import statics from './statics'
import { join } from 'path'

let isQuiting = false

export default ({ app, mainWindow }) => {
  const menu = Menu.buildFromTemplate([
    {
      label: 'Show bKit', click: function () {
        mainWindow.show()
      }
    }, {
      label: 'Quit', click: function () {
        isQuiting = true
        app.quit()
      }
    }
  ])
  
  try {
    const icon = join(statics,'icons','icon-128x128.png')
    say.log(`Load icon from ${icon}`)
    const tray = new Tray(icon)

    tray.setContextMenu(menu)
    mainWindow.on('close', event => {
      say.log('Close catch')
      if (!isQuiting) {
        event.preventDefault()
        mainWindow.hide()
        event.returnValue = false
      }
    })
    mainWindow.on('minimize',function(event){
        event.preventDefault()
        mainWindow.hide()
    })
    return tray
  } catch (e) {
    say.error('Error on tray module', e)
  }
  return undefined
}
