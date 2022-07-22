// Idea from https://medium.com/@karenmarkosyan/how-to-manage-promises-into-dynamic-queue-with-vanilla-javascript-9d0d1f8d4df5
export default class Queue {
  constructor (limit = 1) {
    this.queue = []
    this.pendingPromise = false
    this.limit = limit
    this.workingOnPromise = 0
  }

  enqueue (promise, key = undefined) {
    return new Promise((resolve, reject) => {
      this.queue.push({ promise, resolve, reject, key })
      this._run()
    })
  }

  removeItems (key) {
    if (!key) return []
    const result = []
    let i = this.queue.length
    while (i--) {
      if (this.queue[i].key === key) {
        result.push(this.queue[i])
        this.queue.splice(i, 1)
      }
    }
    return result
  }

  position (key) {
    if (!key) return []
    const result = []
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].key === key) {
        result.push(i)
      }
    }
    return result
  }

  dismiss (key) {
    this.removeItems(key).forEach(e => e.reject('Dismiss from queue'))
  }

  _resolve (item, value) {
    item.resolve(value)
  }

  _reject (item, value) {
    item.reject(value)
  }

  _run () {
    if (this.workingOnPromise >= this.limit) {
      return false
    }
    const item = this.queue.shift()
    if (!item) {
      return false
    }
    this.workingOnPromise++
    item.promise()
      .then(value => this._resolve(item, value))
      .catch(value => {
        console.warn(`Queue catch error: ${value} -`, value)
        this._reject(item, value)
      })
      .finally(() => {
        this.workingOnPromise--
        this._run()
      })
    return true
  }
}

export class QueueByKey extends Queue {
  _resolve (item, value) {
    item.resolve(value)
    // also resolve duplicate requests
    this.removeItems(item.key).forEach(e => e.resolve(value))
  }

  _reject (item, value) {
    item.reject(value)
    // also reject duplicate requests
    this.removeItems(item.key).forEach(e => e.reject(value))
  }
}

export class QueueLast extends Queue {
  enqueue (promise, key, info) {
    return new Promise((resolve, reject) => {
      this.removeItems(key).forEach(e => e.reject(new QueueException('Replaced', `${e.info}[${key}]`)))
      this.queue.push({ promise, resolve, reject, key, info })
      this._run()
    })
  }
}

class QueueException extends Error {
  constructor (name, message) {
    super(message)
    this.name = name
  }
}
