import { Notify } from 'quasar'

export function warn (warn, notify = true) {
  if (notify) {
    Notify.create({
      message: `Warning: ${warn}`,
      multiline: true,
      position: 'top-right',
      timeout: 10000,
      icon: 'warning',
      actions: [{
        label: 'Dismiss',
        icon: 'cancel',
        handler: () => {}
      }]
    })
  }
  console.warn(warn)
}

export function show (msg) {
  console.info(msg)
  Notify.create({
    message: msg,
    type: 'positive',
    position: 'top-right',
    timeout: 3000
  })
}

export function error (msg, detail = '') {
  console.error(msg, detail)
  Notify.create({
    message: msg,
    caption: detail,
    type: 'negative',
    position: 'top-right',
    timeout: 10000,
    actions: [{
      label: 'Dismiss',
      icon: 'cancel',
      handler: () => {}
    }]
  })
}

export function catched (e) {
  const msg = e.toString()
  if (e.response instanceof Object && e.response.data instanceof Object) {
    error(msg, e.response.data.msg)
  } else {
    error(msg)
  }
}

export function notify (arg = {}) {
  console.info(arg)
  Notify.create(arg)
}
