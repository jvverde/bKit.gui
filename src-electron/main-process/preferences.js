import say from './say'
import Store from 'electron-store'

const store = new Store({ name: 'preferences' })

const load_preferences = () => store.get('preferences') || {}

let preferences = load_preferences()

export const set_preferences = prefs => {
  preferences = { ...preferences, ...prefs }
}

export const get_preferences = () => preferences
export const save_preferences = () => store.set('preferences', preferences)

