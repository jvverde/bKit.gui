// From https://medium.com/@karenmarkosyan/how-to-manage-promises-into-dynamic-queue-with-vanilla-javascript-9d0d1f8d4df5
class Queue {
  constructor (limit = 1) {
    this.queue = []
    this.pendingPromise = false
    this.limit = limit
  }

  enqueue (doitAsync) {
    return new Promise((resolve, reject) => {
      this.queue.push({ doitAsync, resolve, reject})
      this._run()
    })
  }

  _run () {
    if (this.workingOnPromise) {
      return false
    }
    const item = this.queue.shift()
    if (!item) {
      return false
    }
    this.workingOnPromise = true
    item.doitAsync()
      .then(value => {
        item.resolve(value)
      })
      .catch(value => {
        console.error(`Queue catch error: (${value})`, value)
        item.reject(value)
      })
      .finally(() => {
        this.workingOnPromise = false
        this._run()
      })
  }
}

class DesdupQueue extends Queue {
  constructor () {
    super()
    this.pending = {}
  }
  enqueue (promise, key) {
    const resolveAll = (value) => {
      for (const p of this.pending[key]) {
        p.resolve(value)
      }
      return Promise.resolve(value)
    }
    const rejectAll = (value) => {
      for (const p of this.pending[key]) {
        p.reject(value)
      }
      return Promise.reject(value)
    }
    if (this.pending[key]) {
      console.log('Pending', key)
      return new Promise((resolve, reject) => {
        this.pending[key].push({ resolve, reject })
      })
    } else {
      this.pending[key] = []
      console.log('Enqueue', key)
      return super.enqueue(promise)
        .then(resolveAll)
        .catch(rejectAll)
        .finally(() => { 
          this.pending[key] = undefined          
        })
    }
  } 
}

const f = (val) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('Timeout', val)
      reject(val)
    },1000)
  })
}

obj = new DesdupQueue()
obj.enqueue(() => f('1a'), 'a').then(v => console.log('Then 1a', v))
obj.enqueue(() => f('2b'), 'b').then(v => console.log('Then 2b', v))
obj.enqueue(() => f('3c'), 'c').then(v => console.log('Then 3c', v))
obj.enqueue(() => f('4c'), 'c').then(v => console.log('Then 4c', v)).catch(v => console.log('Catch 4c', v))
obj.enqueue(() => f('5c'), 'c').then(v => console.log('Then 5c', v)).catch(v => console.log('Catch 5c', v))
obj.enqueue(() => f('6d'), 'd')
  .then(v => {
    obj.enqueue(() => f('7c'), 'c')
    obj.enqueue(() => f('8c'), 'c')
  })

class LastQueue extends Queue {
  constructor () {
    super()
    this.pending = {}
  }
  enqueue (doitAsync, key) {
    return new Promise((resolve, reject) => {
      this.queue = this.queue.filter(e => e.key !== key)
      this.queue.push({ doitAsync, resolve, reject})
      this._run()
    })
  }
}

obj2 = new LastQueue()
obj2.enqueue(() => f('2.1a'), 'a').then(v => console.log('Then a', v))
obj2.enqueue(() => f('2.2b'), 'b').then(v => console.log('Then b', v))
obj2.enqueue(() => f('2.3c'), 'c').then(v => console.log('Then c', v))
obj2.enqueue(() => f('2.4c'), 'c').then(v => console.log('Then c', v))
obj2.enqueue(() => f('2.5c'), 'c').then(v => console.log('Then c', v))
obj2.enqueue(() => f('2.5d'), 'd').then(v => console.log('Then d', v))
