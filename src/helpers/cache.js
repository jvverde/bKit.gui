// From : https://medium.com/@niwaa/using-es6-proxy-to-meta-program-in-javascript-implement-caching-logging-etc-577e253b3e05

export function makeItCacheable (fn) {
  const cache = {}
  return new Proxy(fn, {
    apply: (target, thisArg, [args, events = {}, done = () => false]) => {
      let argsKey = target.name + args.join('') + Object.keys(events).join('')
      console.log('apply argsKey', argsKey)
      console.log('cache keys', Object.keys(cache))
      console.log('cache', cache[argsKey])
      if (cache[argsKey] && 'done' in cache[argsKey]) {
        if (events instanceof Function) {
          (cache[argsKey].event || []).forEach(arg => {
            console.log('Event arg cached', arg)
            events(...arg)
          })
          return done(cache[argsKey].done)
        } else if (events instanceof Object) {
          (cache[argsKey].events || []).forEach(entry => {
            console.log('Event entry cached', entry)
            const eventname = entry.name
            events[eventname](...entry.args)
          })
          return done(cache[argsKey].done)
        } else {
          // Just in case. It isn't going to happen (unless the caller don't set events argument)
          return target.apply(thisArg, [args, events, done])
        }
      } else {
        cache[argsKey] = {}
        let myevents = {} // it may be changed bellow to become a Function
        if (events instanceof Function) {
          cache[argsKey].event = []
          myevents = function (...args) {
            console.log('Event', args)
            cache[argsKey].event.push(args)
            events(...args)
          }
        } else if (events instanceof Object) {
          cache[argsKey].events = []
          for (let [name, event] of Object.entries(events)) {
            myevents[name] = function (...args) {
              console.log(`Event ${name}`, args)
              cache[argsKey].events.push({ name, args })
              event(...args)
            }
          }
        } else {
          myevents = events
        }
        const mydone = function (code) {
          if (code !== 0) cache[argsKey] = undefined
          else cache[argsKey].done = code
          console.log('Done', code)
          done(code)
        }
        return target.apply(thisArg, [args, myevents, mydone])
      }
    }
  })
}
