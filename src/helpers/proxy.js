'use strict'
const deepclone = require('lodash.clonedeep')
function deepFreeze (object) {
  // Retrieve the property names defined on object
  var propNames = Object.getOwnPropertyNames(object)

  // Freeze properties before freezing self

  for (let name of propNames) {
    let value = object[name]

    if (value && typeof value === 'object') {
      deepFreeze(value)
    }
  }

  return Object.freeze(object)
}

// From : https://medium.com/@niwaa/using-es6-proxy-to-meta-program-in-javascript-implement-caching-logging-etc-577e253b3e05
import LRUcache from './LRU'

class CacheException extends Error {
  constructor (message, value) {
    super(message)
    this.name = 'cacheException'
    this.value = value
  }
}

export class InvalidateCache {
}

const _global = new LRUcache(10)

export default function proxyIt (fn, { cache = _global, name = 'default' }) {
  if (!(cache instanceof LRUcache)) {
    throw new CacheException('Parameter cache must be of type LRUcache', cache)
  }
  return new Proxy(fn, {
    apply: async (target, thisArg, args) => {
      // const invalidateCache = args[0] instanceof InvalidateCache
      const index = args.findIndex(e => e instanceof InvalidateCache)
      // console.log('Proxy args', args)
      if (index >= 0) {
        args.splice(index, 1)
      }

      const key = target.name + args.join('')

      if (index >= 0) {
        console.log(target.name, 'Invalidate Cache for key ', key)
        cache.remove(key)
      }

      const hit = cache.read(key)
      if (hit) { // is a HIT
        console.log(`Cache:${name} for target ${target.name} HIT`, key)
        return deepclone(hit)
      } else { // Is a MISS
        console.log(`Cache:${name} for target ${target.name} MISS`, key)
        try {
          const result = await target.apply(thisArg, args)
          deepFreeze(result)
          cache.write(key, result)
          return deepclone(result)
        } catch (err) {
          console.error(`Proxy error, with key ${key}: (${err})`, err)
        }
      }
    }
  })
}

export function exclusiveProxy (fn, { size = 5, name = 'exclusive' }) {
  const cache = new LRUcache(size)
  return proxyIt(fn, { cache, name })
}
