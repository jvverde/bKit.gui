// import something here

import { Notify } from 'quasar'

Notify.setDefaults({
  position: 'top-right',
  timeout: 2500,
  textColor: 'white',
  actions: [{ icon: 'close', color: 'white' }]
})

// "async" is optional
// export default async ({ app /* app, router, Vue, ... */ } ) => {
export default async ({ app }) => {
  // something to do
  return {}
}
