import say from './say'
import Store from 'electron-store'

const store = new Store({ name: 'preferences' })

const load_preferences = () => store.get('preferences') || {}

let preferences = load_preferences()

say.log('Preferences', preferences)

export const set_preferences = prefs => {
  preferences = { ...preferences, ...prefs }
}

export const get_preferences = () => preferences

export const save_preferences = () => {
  preferences.lasttime = new Date(Date.now()).toISOString() 
  store.set('preferences', preferences)
  say.log('Saved preferences')
}
