import {  Menu } from 'electron'
import { check4updates, getUpdates } from './auto-update'

// from https://www.tutorialspoint.com/electron/electron_menus.htm
const template = [
  {
    role: 'fileMenu',
    submenu: [
      {
        label: 'Upgrade GUI',
        submenu: [
          {
            label: 'Beta',
            click: async () => {
              await getUpdates('beta')
            }
          },{
            label: 'Stable',
            click: async () => {
              await getUpdates('latest')
            }
          }
        ]
      },
      {
        role: 'quit'
      }
    ]
  },{
    label: 'Edit',
    submenu: [{
        role: 'undo'
      },{
        role: 'redo'
      },{
        type: 'separator'
      },{
        role: 'cut'
      },{
        role: 'copy'
      },{
        role: 'paste'
      },{
        type: 'separator'
      }]
  },{
    label: 'View',
    submenu: [{
        role: 'reload'
      },{
        role: 'forceReload'
      },{
        role: 'toggledevtools'
      },{
        type: 'separator'
      },{
        role: 'resetzoom'
      },{
        role: 'zoomin'
      },{
        role: 'zoomout'
      },{
        type: 'separator'
      },{
        role: 'togglefullscreen'
      }]
  },{
    role: 'window',
    submenu: [{
        role: 'minimize'
      },{
        role: 'close'
      }]
  } /*,{
    role: 'help',
    submenu: [{
        label: 'Learn More'
       }]
  }*/
]

export default function () {
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
