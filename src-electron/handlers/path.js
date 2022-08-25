'use strict'
import { ipcMain } from 'electron'
import say from '../utils/say'

import { relative, normalize, sep, posix , resolve, join } from 'path'


const cloneposix = { sep: posix.sep, delimiter: posix.delimiter }
say.log('cloneposix', cloneposix)

const schedule = {
  join: (...args) => join(...args),
  relative: (...args) => relative(...args),
  normalize: (...args) => normalize(...args),
  resolve: (...args) => resolve(...args),
  posix: () => cloneposix,
  sep: () => sep
}

const nill = () => false

ipcMain.on('usepath', async (event, name, ...args) => {
  try {
    const f = schedule[name] || nill 
    return event.returnValue = f(...args)
  } catch (e) {
    say.error('[usepath]', e)
    return undefined
  }
})

export default false
