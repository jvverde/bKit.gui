import {
  app,
  Tray,
  Menu
} from 'electron'

import say from './say'
import statics from './statics'
import { join } from 'path'

let isQuiting = false

app.on('before-quit', () => {
  say.log('Before quit on Tray')
  isQuiting = true
})

export default ({ mainWindow }) => {

  const menu = Menu.buildFromTemplate([
    {
      label: 'Show bKit',
      click: () => {
        mainWindow.show()
      }
    }, {
      label: 'Hide',
      click: () => {
        mainWindow.hide()
      }
    }, {
      label: 'Quit',
      click: () => {
        isQuiting = true
        app.quit()
      }
    }
  ])
  
  try {
    const icon = join(statics,'icons','icon-128x128.png')
    say.log(`Load icon from ${icon}`)
    const tray = new Tray(icon)

    tray.setToolTip('bKit App')
    tray.setContextMenu(menu)
    tray.on('click', () => {
        mainWindow.show()      
    })
    mainWindow.on('close', event => {
      say.log(`Close catch while isQuiting = ${isQuiting}`)
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
