import { Notify } from 'quasar'

export function warn (warn) {
  Notify.create({
    message: `Warning: ${warn}`,
    multiline: true,
    icon: 'warning'
  })
}
