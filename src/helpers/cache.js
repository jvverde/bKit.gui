// From : https://medium.com/@niwaa/using-es6-proxy-to-meta-program-in-javascript-implement-caching-logging-etc-577e253b3e05
import LRUcache from './LRU'

export function makeItCacheable (fn) {
  const cache = new LRUcache(20)
  return new Proxy(fn, {
    apply: (target, thisArg, [args, events, done]) => {
      let key = target.name + args.join('') + Object.keys(events).join('')
      const hit = cache.read(key)
      if (hit) { // is a HIT
        console.log('Hit', key)
        if (events instanceof Function) {
          (hit.event || []).forEach(arg => {
            events(...arg)
          })
          return done(hit.done)
        } else if (events instanceof Object) {
          (hit.events || []).forEach(entry => {
            const eventname = entry.name
            events[eventname](...entry.args)
          })
          return done(hit.done)
        } else {
          console.warn("Just in case. It isn't going to happen", hit)
          return target.apply(thisArg, [args, events, done])
        }
      } else { // Is a MISS
        console.log('Miss', key)
        const store = {}
        let myevents = {} // it may be changed bellow to become a Function
        if (events instanceof Function) {
          store.event = []
          myevents = function (...args) {
            store.event.push(args)
            events(...args)
          }
        } else if (events instanceof Object) {
          store.events = []
          for (let [name, event] of Object.entries(events)) {
            myevents[name] = function (...args) {
              store.events.push({ name, args })
              event(...args)
            }
          }
        } else {
          console.warn("It isn't supposed to enter here", args)
          myevents = events
        }
        const mydone = function (code) {
          if (code === 0) {
            store.done = code
            cache.write(key, store)
          }
          done(code)
        }
        return target.apply(thisArg, [args, myevents, mydone])
      }
    }
  })
}
