/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */

import say from './say'
import { join } from 'path'

// say.log('process.env.PROD', process.env.PROD)

if (process.env.PROD) {
  global.__statics = join(__dirname, 'statics').replace(/\\/g, '\\\\')
  global.__statics = __dirname
}

say.log('__statics', __statics)
say.log('__dirname', __dirname)

export default __statics
