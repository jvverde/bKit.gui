/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */

import say from './say'
import { join } from 'path'

if (process.env.PROD) {
  global.__statics = join(__dirname, 'statics').replace(/\\/g, '\\\\')
}

say.log('__statics', __statics)
say.log('__dirname', __dirname)

export default __statics
