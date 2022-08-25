'use strict'
import { ipcMain } from 'electron'
import { encrypt, decrypt, hmac, hash } from '../helpers/secrets' 

ipcMain.on('encrypt', (event, text, password, algorithm) => {
  event.returnValue = encrypt(text, password, algorithm)
})
ipcMain.on('decrypt', (event, message, password, algorithm) => {
  event.returnValue = decrypt(message, password, algorithm)
})
ipcMain.on('hmac', (event, text, key) => {
  event.returnValue = hmac(text, key)
})
ipcMain.on('hash', (event, msg) => {
  event.returnValue = hash(msg)
})

export default false