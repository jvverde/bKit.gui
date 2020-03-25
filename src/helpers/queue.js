// Idea from https://medium.com/@karenmarkosyan/how-to-manage-promises-into-dynamic-queue-with-vanilla-javascript-9d0d1f8d4df5
export default class Queue {
  constructor (limit = 1) {
    this.queue = []
    this.pendingPromise = false
    this.limit = limit
  }

  enqueue (promise) {
    return new Promise((resolve, reject) => {
      this.queue.push({ promise, resolve, reject })
      this._run()
    })
  }

  _extractDuplicateItems (key) {
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

  _resolve (item, value) {
    item.resolve(value)
  }

  _reject (item, value) {
    item.reject(value)
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
    item.promise()
      .then(value => {
        this._resolve(item, value)
        return Promise.resolve(value)
      })
      .catch(value => {
        console.error(`Queue catch error: (${value})`, value)
        this._reject(item, value)
      })
      .finally(() => {
        this.workingOnPromise = false
        this._run()
      })
    return true
  }
}

export class QueueByKey extends Queue {
  enqueue (promise, key = undefined) {
    return new Promise((resolve, reject) => {
      this.queue.push({ promise, resolve, reject, key })
      this._run()
    })
  }

  _extractDuplicateItems (key) {
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

  _resolve (item, value) {
    item.resolve(value)
    // also resolve duplicate requests
    this._extractDuplicateItems(item.key).forEach(e => e.resolve(value))
  }

  _reject (item, value) {
    item.reject(value)
    // also reject duplicate requests
    this._extractDuplicateItems(item.key).forEach(e => e.reject(value))
  }
}

export class QueueLast extends Queue {
  enqueue (promise, key, info) {
    return new Promise((resolve, reject) => {
      const aborted = this.queue.filter(e => e.key === key)
      this.queue = this.queue.filter(e => e.key !== key)
      this.queue.push({ promise, resolve, reject, key, info })
      aborted.forEach(e => e.reject(new QueueException('Replaced', `${e.info}[${key}]`)))
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
