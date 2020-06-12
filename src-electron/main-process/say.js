import log  from 'electron-log'

export default {
  log: (...args) => {
    console.log(...args)
    log.info(...args)
  },
  warn: (...args) => {
    console.warn(...args)
    log.warn(...args)
  },
  error: (...args) => {
    console.error(...args)
    log.error(...args)
  }
}
