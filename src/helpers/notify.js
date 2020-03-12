import { Notify } from 'quasar'

export function warn (warn, notify = true) {
  if (notify) {
    Notify.create({
      message: `Warning: ${warn}`,
      multiline: true,
      icon: 'warning'
    })
  }
  console.warn(warn)
}
