import log  from 'electron-log'

export default {
  log: (...args) => {
    try {
      console.log(...args)
      log.info(...args)
    } catch(_) {}
  },
  warn: (...args) => {
    try {
      console.warn(...args)
      log.warn(...args)
    } catch(_)  {}
  },
  error: (...args) => {
    try {
      console.error(...args)
      log.error(...args)
    } catch(_) {}
  }
}
