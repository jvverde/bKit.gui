import { webContents, Notification, dialog } from 'electron'

import say from './utils/say'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

autoUpdater.logger = log
autoUpdater.allowDowngrade = true
autoUpdater.autoInstallOnAppQuit = false
autoUpdater.autoDownload = false
autoUpdater.logger.transports.file.level = 'info'
autoUpdater.on('error', (err) => {
  log.error(err)
})

export function check4updates () {
  autoUpdater.on('update-available', (info) => {
    // sendStatusToWindow(info)
    say.log(info)
    if (Notification.isSupported()) {
      const notify = new Notification({
        title: 'Updated version',
        body: `A new version ${info.version} is available`
      })
      notify.show()
    }
  })
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.autoDownload = false
  say.log(`Check for updates...`)
  autoUpdater.checkForUpdatesAndNotify()
}

export function getUpdates(channel = 'latest') {
  autoUpdater.channel = channel
  autoUpdater.on('update-not-available', (info) => {
    dialog.showMessageBox({
      title: 'No Updates',
      message: 'Current version is up-to-date.'
    })
  })
  autoUpdater.on('update-downloaded', (info) => {
    setImmediate(() => autoUpdater.quitAndInstall())
  })
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.autoDownload = true
  say.log(`Check and get updates on channel ${channel}`)
  return autoUpdater.checkForUpdates()
}

// function sendStatusToWindow(text) {
//   say.log(text)
//   // webContents.getFocusedWebContents()
//   mainWindow.webContents.send('message', text)
// }
