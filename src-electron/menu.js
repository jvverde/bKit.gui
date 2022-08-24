import {  Menu, MenuItem, app } from 'electron'
import { check4updates, getUpdates } from './auto-update'
import AutoLaunch from 'auto-launch'
import say from './utils/say'

const fileMenu = {
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
}  

const template = [
  fileMenu,
  {
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

const exe = app.getPath('exe')
say.log('App path = ', exe)

const autoLaunch = new AutoLaunch({
  name: 'bKit App',
  path: exe
})

const start = {
 label: 'Start on boot',
  click: async () => {
    try {
      const isLaunched = await autoLaunch.isEnabled()
      if (!isLaunched) {
        autoLaunch.enable()
        fileMenu.submenu[0] = stop
        setMenu(template)
      }
    } catch(e) {
      say.error('AutoLaunch Error:', e)
    }
  } 
}

const stop = {
  label: 'Disable Start on boot',
  click: async () => {
    try {
      const isLaunched = await autoLaunch.isEnabled()
      if (isLaunched) {
        autoLaunch.disable()
        fileMenu.submenu[0] = start
        setMenu(template)
      }
    } catch(e) {
      say.error('AutoLaunch Error:', e)
    }
  }
}

const setMenu = (t = template) => {
  const menu = Menu.buildFromTemplate(t)
  Menu.setApplicationMenu(menu)
}
export default async () => {
  try {
    const isLaunched = await autoLaunch.isEnabled()
    if (isLaunched) {
      fileMenu.submenu.unshift(stop)
    } else {
      fileMenu.submenu.unshift(start)
    }
    setMenu(template)
  } catch (e) {
    say.error('Menu error', e)
  }
}
